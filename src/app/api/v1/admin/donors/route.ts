import {NextRequest, NextResponse} from "next/server";
import {DonorSource, DonorStatus, Prisma} from "@prisma/client";
import {prisma} from "../../../../../../prisma/prisma";
import {requireRole} from "@/services/userService";
import {getDonorPhotoUrl} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";

// Admin: every donor across NGOs, filterable and paginated
export async function GET(req: NextRequest) {
	try {
		const {error, response} = await requireRole(["admin"]);
		if (error) return response;

		const searchParams = req.nextUrl.searchParams;
		const page = Math.max(Number(searchParams.get("page")) || 1, 1);
		const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 10, 1), 100);
		const search = searchParams.get("search")?.trim();
		const status = searchParams.get("status");
		const source = searchParams.get("source");
		const bloodGroup = searchParams.get("bloodGroup");
		const organisationId = searchParams.get("organisationId");

		const where: Prisma.DonorWhereInput = {};

		if (search) {
			where.OR = [
				{name: {contains: search, mode: "insensitive"}},
				{email: {contains: search, mode: "insensitive"}},
				{phone: {contains: search}},
				{locationName: {contains: search, mode: "insensitive"}},
			];
		}

		if (status && Object.values(DonorStatus).includes(status as DonorStatus)) {
			where.status = status as DonorStatus;
		}

		if (source && Object.values(DonorSource).includes(source as DonorSource)) {
			where.source = source as DonorSource;
		}

		if (bloodGroup) {
			where.bloodGroup = bloodGroup;
		}

		if (organisationId) {
			where.organisationId = organisationId;
		}

		const [donors, total] = await Promise.all([
			prisma.donor.findMany({
				where,
				orderBy: {createdAt: "desc"},
				skip: (page - 1) * pageSize,
				take: pageSize,
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					gender: true,
					dob: true,
					bloodGroup: true,
					photo: true,
					locationName: true,
					status: true,
					source: true,
					isAvailable: true,
					lastDonatedAt: true,
					createdAt: true,
					userId: true,
					Organisation: {select: {id: true, name: true}},
					_count: {select: {RequestDonors: {where: {DonationCertificate: {isNot: null}}}}},
				},
			}),
			prisma.donor.count({where}),
		]);

		const data = donors.map(({_count, Organisation, userId, photo, ...donor}) => ({
			...donor,
			photo: getDonorPhotoUrl(photo),
			hasAccount: !!userId,
			organisation: Organisation,
			donationCount: _count.RequestDonors,
		}));

		return NextResponse.json(
			{
				success: true,
				data,
				pagination: {page, pageSize, total, totalPages: Math.ceil(total / pageSize)},
			},
			{status: 200},
		);
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
