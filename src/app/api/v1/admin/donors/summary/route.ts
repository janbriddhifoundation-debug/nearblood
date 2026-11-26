import {NextResponse} from "next/server";
import {prisma} from "../../../../../../../prisma/prisma";
import {requireRole} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";

// Admin: donor and donation totals for the oversight page, plus the NGO list for its filter
export async function GET() {
	try {
		const {error, response} = await requireRole(["admin"]);
		if (error) return response;

		const [byStatus, bySource, byBloodGroup, available, withAccount, totalDonations, pendingCertificates, organisations] = await Promise.all([
			prisma.donor.groupBy({by: ["status"], _count: {_all: true}}),
			prisma.donor.groupBy({by: ["source"], _count: {_all: true}}),
			prisma.donor.groupBy({by: ["bloodGroup"], where: {status: "APPROVED"}, _count: {_all: true}}),
			prisma.donor.count({where: {status: "APPROVED", isAvailable: true}}),
			prisma.donor.count({where: {userId: {not: null}}}),
			prisma.donationCertificate.count(),
			// Closed requests whose donors have no certificate yet
			prisma.requestDonors.count({where: {DonationCertificate: null, Request: {RequestActivity: {some: {activity: "REQUEST_CLOSED"}}}}}),
			prisma.organisation.findMany({where: {approvedAt: {not: null}}, select: {id: true, name: true}, orderBy: {name: "asc"}}),
		]);

		// groupBy rows -> {value: count}
		const toCounts = (rows: {key: string | null; count: number}[]) => Object.fromEntries(rows.map((row) => [row.key ?? "Unknown", row.count]));

		const status = toCounts(byStatus.map((row) => ({key: row.status, count: row._count._all})));

		return NextResponse.json(
			{
				success: true,
				summary: {
					totalDonors: Object.values(status).reduce((sum, value) => sum + value, 0),
					status,
					source: toCounts(bySource.map((row) => ({key: row.source, count: row._count._all}))),
					bloodGroups: toCounts(byBloodGroup.map((row) => ({key: row.bloodGroup, count: row._count._all}))),
					availableDonors: available,
					donorsWithAccount: withAccount,
					totalDonations,
					pendingCertificates,
				},
				organisations,
			},
			{status: 200},
		);
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
