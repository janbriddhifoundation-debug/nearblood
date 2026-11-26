import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../prisma/prisma";

export async function GET(request: NextRequest) {
	try {
		const {searchParams} = new URL(request.url);
		const email = searchParams.get("email");

		if (!email) {
			return NextResponse.json({error: "Email is required"}, {status: 400});
		}

		const user = await prisma.user.findUnique({
			where: {email},
			select: {
				id: true,
				role: true,
			},
		});

		if (!user) {
			// User doesn't exist yet, return default values
			return NextResponse.json({
				user: {
					id: null,
					role: null,
				},
			});
		}
		// If user is an NGO, fetch their linked organisation
		if (user.role === "ngo") {
			const organisation = await prisma.organisation.findFirst({
				where: {userId: user.id},
				select: {id: true, approvedAt: true},
			});

			if (organisation) {
				return NextResponse.json({
					user: {
						id: user.id,
						role: user.role,
						organisationId: organisation.id,
						isApprovedNgo: organisation.approvedAt !== null,
					},
				});
			} else {
				return NextResponse.json({
					user: {
						id: user.id,
						role: user.role,
						organisationId: null,
						isApprovedNgo: false,
					},
				});
			}
		}

		return NextResponse.json({
			user: {
				id: user.id,
				role: user.role,
				organisationId: null,
				isApprovedNgo: false,
			},
		});
	} catch (error) {
		console.error("Error fetching user data:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}
