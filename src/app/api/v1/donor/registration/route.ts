import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {isPersonalRole} from "@/utils/roleRoutes";
import {donorSelfRegistrationSchema} from "@/validationSchema/donorSchema";
import {notifyOrganisation} from "@/services/notificationService";

// Onboarding state for the signed-in person: their own donor profile, or an NGO-added record with the same email they can claim
export async function GET() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!isPersonalRole(user.role)) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const [donor, claimable] = await Promise.all([
			prisma.donor.findUnique({
				where: {userId: user.id},
				select: {id: true, name: true, status: true, bloodGroup: true, Organisation: {select: {id: true, name: true}}},
			}),
			prisma.donor.findFirst({
				where: {email: {equals: user.email, mode: "insensitive"}, userId: null},
				select: {id: true, name: true, bloodGroup: true, Organisation: {select: {name: true}}},
			}),
		]);

		return NextResponse.json(
			{
				success: true,
				donor,
				claimable: claimable ? {name: claimable.name, bloodGroup: claimable.bloodGroup, organisationName: claimable.Organisation?.name ?? null} : null,
			},
			{status: 200},
		);
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

// Self sign-up: creates a PENDING donor under the chosen NGO (or re-applies after a rejection)
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!isPersonalRole(user.role)) {
			return NextResponse.json({error: "Only requester or donor accounts can register as a donor"}, {status: 403});
		}

		const validationResult = donorSelfRegistrationSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {organisationId, dob, latitude, longitude, ...details} = validationResult.data;

		const [ownDonor, claimable, phoneOwner, organisation] = await Promise.all([
			prisma.donor.findUnique({where: {userId: user.id}, select: {id: true, status: true}}),
			prisma.donor.findFirst({where: {email: {equals: user.email, mode: "insensitive"}, userId: null}, select: {id: true}}),
			prisma.donor.findFirst({where: {phone: details.phone, NOT: {userId: user.id}}, select: {Organisation: {select: {name: true}}}}),
			prisma.organisation.findFirst({where: {id: organisationId, approvedAt: {not: null}}, select: {id: true}}),
		]);

		if (ownDonor && ownDonor.status !== "REJECTED") {
			return NextResponse.json({error: "You are already registered as a donor"}, {status: 409});
		}

		if (claimable) {
			return NextResponse.json({error: "An NGO has already registered you as a donor. Link that profile instead."}, {status: 409});
		}

		if (phoneOwner) {
			const ngoName = phoneOwner.Organisation?.name;
			return NextResponse.json({error: `This phone number is already registered${ngoName ? ` with ${ngoName}` : ""}. Please contact them or use another number.`}, {status: 409});
		}

		if (!organisation) {
			return NextResponse.json({error: "Selected NGO is not available"}, {status: 400});
		}

		const data = {
			...details,
			dob: new Date(dob),
			latitude,
			longitude,
			organisationId,
			status: "PENDING" as const,
		};

		const donor = await prisma.$transaction(async (tx) => {
			const savedDonor = ownDonor
				? await tx.donor.update({where: {id: ownDonor.id}, data})
				: await tx.donor.create({data: {...data, email: user.email, userId: user.id, source: "SELF"}});

			await tx.$executeRaw`
				UPDATE "Donor"
				SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
				WHERE id = ${savedDonor.id}
			`;

			return savedDonor;
		});

		await notifyOrganisation(organisationId, {
			type: "DONOR_SIGNUP",
			title: "New donor wants to join",
			message: `${details.name} (${details.bloodGroup}) signed up to donate through your organisation.`,
			link: "/ngo/donors",
		});

		return NextResponse.json({success: true, donor: {id: donor.id, status: donor.status}}, {status: 201});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
