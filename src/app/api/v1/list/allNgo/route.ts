import { NextResponse } from "next/server";
import { prisma } from "../../../../../../prisma/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
	try {
		const {searchParams} = new URL(request.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const whereClause: Prisma.OrganisationWhereInput = {};

    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status === "approved") {
      whereClause.approvedAt = { not: null };
    } else if (status === "pending") {
      whereClause.approvedAt = null;
    }

		const [ngos, total] = await Promise.all([
			prisma.organisation.findMany({
				where: whereClause,
				select: {
					id: true,
					name: true,
					type: true,
					address: true,
					createdAt: true,
					approvedAt: true,
					user: {
						select: {
							email: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: limit,
			}),

			prisma.organisation.count({
				where: whereClause,
			}),
		]);

		const data = ngos.map((ngo) => ({
			key: ngo.id,
			name: ngo.name,
			email: ngo.user?.email ?? "",
			type: ngo.type,
			address: ngo.address,
			registeredAt: ngo.createdAt,
			approvedAt: ngo.approvedAt,
			status: ngo.approvedAt ? "APPROVED" : "PENDING",
		}));

		return NextResponse.json(
			{
				data,
				meta: {
					page,
					limit,
					total,
				},
			},
			{status: 200},
		);
	} catch (error) {
		console.error(error);
		return NextResponse.json({error: "Failed to fetch NGOs"}, {status: 500});
	}
}
