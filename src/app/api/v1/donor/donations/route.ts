import {NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveDonor} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";

// Every request this donor was assigned to, with its current stage and certificate (if issued).
// Patient name and contact are left out on purpose.
export async function GET() {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const assignments = await prisma.requestDonors.findMany({
			where: {donorId: donor.id},
			orderBy: {createdAt: "desc"},
			select: {
				id: true,
				createdAt: true,
				Organisation: {select: {name: true}},
				DonationCertificate: {select: {id: true, certificateNumber: true, generatedAt: true}},
				Request: {
					select: {
						id: true,
						hospital: true,
						locationName: true,
						bloodGroup: true,
						units: true,
						requirementDate: true,
						RequestActivity: {select: {activity: true}, orderBy: {createdAt: "desc"}, take: 1},
					},
				},
			},
		});

		const data = assignments.map((item) => ({
			id: item.id,
			assignedAt: item.createdAt,
			organisationName: item.Organisation?.name ?? null,
			requestId: item.Request?.id ?? null,
			hospital: item.Request?.hospital ?? null,
			locationName: item.Request?.locationName ?? null,
			bloodGroup: item.Request?.bloodGroup ?? null,
			units: item.Request?.units ?? null,
			requirementDate: item.Request?.requirementDate ?? null,
			requestStatus: item.Request?.RequestActivity[0]?.activity ?? "UNKNOWN",
			certificate: item.DonationCertificate,
		}));

		return NextResponse.json({success: true, data}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
