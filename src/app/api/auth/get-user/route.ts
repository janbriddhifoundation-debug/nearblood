import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../prisma/prisma";
import {isPersonalRole} from "@/utils/roleRoutes";

// Called by the NextAuth session callback (edge runtime can't use Prisma) to put role/onboarding info on the session.
// Server-to-server only: the caller must send AUTH_SECRET in x-internal-secret.
export async function GET(request: NextRequest) {
	try {
		const secret = process.env.AUTH_SECRET;
		if (!secret || request.headers.get("x-internal-secret") !== secret) {
			return NextResponse.json({error: "Not found"}, {status: 404});
		}

		const email = request.nextUrl.searchParams.get("email");

		if (!email) {
			return NextResponse.json({error: "Email is required"}, {status: 400});
		}

		const user = await prisma.user.findUnique({
			where: {email},
			select: {
				id: true,
				role: true,
				Organisation: {select: {id: true, approvedAt: true}, take: 1},
				Donor: {select: {id: true, status: true}},
			},
		});

		if (!user) {
			// User doesn't exist yet (role not picked)
			return NextResponse.json({user: {id: null, role: null}});
		}

		const organisation = user.role === "ngo" ? user.Organisation[0] : null;
		const donor = isPersonalRole(user.role) ? user.Donor : null;

		return NextResponse.json({
			user: {
				id: user.id,
				role: user.role,
				organisationId: organisation?.id ?? null,
				isApprovedNgo: !!organisation?.approvedAt,
				donorId: donor?.id ?? null,
				donorStatus: donor?.status ?? null,
			},
		});
	} catch (error) {
		console.error("Error fetching user data:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}
