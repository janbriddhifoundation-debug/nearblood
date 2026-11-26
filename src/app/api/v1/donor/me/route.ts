import {NextRequest, NextResponse} from "next/server";
import dayjs from "dayjs";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveDonor, getDonorPhotoUrl, setDonorLocation} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {donorProfileUpdateSchema} from "@/validationSchema/donorSchema";
import {DONATION_GAP_DAYS} from "@/data/Donor";

// Donor profile, their NGO, and donation stats for the donor dashboard
export async function GET() {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const [organisation, assignedCount, certificates] = await Promise.all([
			donor.organisationId
				? prisma.organisation.findUnique({
						where: {id: donor.organisationId},
						select: {id: true, name: true, type: true, address: true, website: true, OrganisationContact: {select: {name: true, designation: true, phone: true, email: true}, take: 1}},
					})
				: null,
			prisma.requestDonors.count({where: {donorId: donor.id}}),
			prisma.donationCertificate.findMany({
				where: {RequestDonor: {donorId: donor.id}},
				select: {generatedAt: true},
				orderBy: {generatedAt: "desc"},
			}),
		]);

		// lastDonatedAt is set when a certificate is issued (or entered by the NGO). Older certificates
		// issued before that existed fall back to the certificate date.
		const lastDonatedAt = donor.lastDonatedAt ?? certificates[0]?.generatedAt ?? null;
		const gapDays = DONATION_GAP_DAYS[(donor.gender as keyof typeof DONATION_GAP_DAYS) ?? "other"] ?? DONATION_GAP_DAYS.other;
		const nextEligibleAt = lastDonatedAt ? dayjs(lastDonatedAt).add(gapDays, "day").toDate() : null;

		return NextResponse.json(
			{
				success: true,
				donor: {
					id: donor.id,
					name: donor.name,
					email: donor.email,
					phone: donor.phone,
					gender: donor.gender,
					dob: donor.dob,
					bloodGroup: donor.bloodGroup,
					address: donor.address,
					locationName: donor.locationName,
					latitude: donor.latitude,
					longitude: donor.longitude,
					photo: donor.photo,
					photoUrl: getDonorPhotoUrl(donor.photo),
					isAvailable: donor.isAvailable,
					status: donor.status,
					createdAt: donor.createdAt,
				},
				organisation: organisation
					? {
							id: organisation.id,
							name: organisation.name,
							type: organisation.type,
							address: organisation.address,
							website: organisation.website,
							contact: organisation.OrganisationContact[0] ?? null,
						}
					: null,
				stats: {
					totalDonations: certificates.length,
					timesAssigned: assignedCount,
					lastDonatedAt,
					nextEligibleAt,
					isEligibleNow: !nextEligibleAt || dayjs().isAfter(nextEligibleAt),
				},
			},
			{status: 200},
		);
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

// Donor edits their own contact details, location, photo and availability
export async function PATCH(req: NextRequest) {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const validationResult = donorProfileUpdateSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {latitude, longitude, photo, ...details} = validationResult.data;

		const phoneOwner = await prisma.donor.findFirst({where: {phone: details.phone, NOT: {id: donor.id}}, select: {id: true}});
		if (phoneOwner) {
			return NextResponse.json({error: "This phone number is already used by another donor"}, {status: 409});
		}

		await prisma.donor.update({
			where: {id: donor.id},
			data: {...details, latitude, longitude, ...(photo ? {photo} : {})},
		});
		await setDonorLocation(donor.id, latitude, longitude);

		return NextResponse.json({success: true}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
