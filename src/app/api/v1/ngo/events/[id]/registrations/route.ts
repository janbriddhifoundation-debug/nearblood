import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getDonorPhotoUrl} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";

type RouteParams = {params: Promise<{id: string}>};

// Donors registered for one of this NGO's camps
export async function GET(_req: NextRequest, {params}: RouteParams) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const {id} = await params;
		const event = await prisma.ngoEvent.findFirst({where: {id, organisationId: user.organisationId}, select: {id: true}});

		if (!event) {
			return NextResponse.json({error: "Event not found"}, {status: 404});
		}

		const registrations = await prisma.eventRegistration.findMany({
			where: {eventId: id},
			orderBy: {createdAt: "asc"},
			select: {
				id: true,
				status: true,
				unitsDonated: true,
				createdAt: true,
				Donor: {select: {id: true, name: true, phone: true, bloodGroup: true, photo: true, organisationId: true, Organisation: {select: {name: true}}}},
			},
		});

		const data = registrations.map(({Donor, ...registration}) => ({
			...registration,
			donor: {
				id: Donor.id,
				name: Donor.name,
				phone: Donor.phone,
				bloodGroup: Donor.bloodGroup,
				photo: getDonorPhotoUrl(Donor.photo),
				// Donors from nearby NGOs can register too
				organisationName: Donor.organisationId === user.organisationId ? null : (Donor.Organisation?.name ?? null),
			},
		}));

		return NextResponse.json({success: true, data}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
