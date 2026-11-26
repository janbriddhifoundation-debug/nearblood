import {NextRequest, NextResponse} from "next/server";
import {Prisma} from "@prisma/client";
import {prisma} from "../../../../../../prisma/prisma";
import {requireRole} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";

// Admin: every donor-to-request assignment across NGOs, with request stage and certificate
export async function GET(req: NextRequest) {
	try {
		const {error, response} = await requireRole(["admin"]);
		if (error) return response;

		const searchParams = req.nextUrl.searchParams;
		const page = Math.max(Number(searchParams.get("page")) || 1, 1);
		const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 10, 1), 100);
		const organisationId = searchParams.get("organisationId");
		const certified = searchParams.get("certified");
		const search = searchParams.get("search")?.trim();

		const where: Prisma.RequestDonorsWhereInput = {};

		if (organisationId) where.organisationId = organisationId;
		if (certified === "yes") where.DonationCertificate = {isNot: null};
		if (certified === "no") where.DonationCertificate = null;

		if (search) {
			where.OR = [
				{Donor: {name: {contains: search, mode: "insensitive"}}},
				{Request: {hospital: {contains: search, mode: "insensitive"}}},
				{requestId: {contains: search, mode: "insensitive"}},
				{DonationCertificate: {certificateNumber: {contains: search, mode: "insensitive"}}},
			];
		}

		const [rows, total] = await Promise.all([
			prisma.requestDonors.findMany({
				where,
				orderBy: {createdAt: "desc"},
				skip: (page - 1) * pageSize,
				take: pageSize,
				select: {
					id: true,
					createdAt: true,
					Donor: {select: {id: true, name: true, bloodGroup: true}},
					Organisation: {select: {id: true, name: true}},
					DonationCertificate: {select: {certificateNumber: true, generatedAt: true}},
					Request: {
						select: {
							id: true,
							hospital: true,
							bloodGroup: true,
							requirementDate: true,
							RequestActivity: {select: {activity: true}, orderBy: {createdAt: "desc"}, take: 1},
						},
					},
				},
			}),
			prisma.requestDonors.count({where}),
		]);

		const data = rows.map((row) => ({
			id: row.id,
			assignedAt: row.createdAt,
			donor: row.Donor,
			organisation: row.Organisation,
			requestId: row.Request?.id ?? null,
			hospital: row.Request?.hospital ?? null,
			bloodGroup: row.Request?.bloodGroup ?? null,
			requirementDate: row.Request?.requirementDate ?? null,
			requestStatus: row.Request?.RequestActivity[0]?.activity ?? "UNKNOWN",
			certificate: row.DonationCertificate,
		}));

		return NextResponse.json({success: true, data, pagination: {page, pageSize, total, totalPages: Math.ceil(total / pageSize)}}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
