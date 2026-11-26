import {auth} from "@/auth";
import {NextResponse} from "next/server";
import {prisma} from "../../prisma/prisma";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {DonorStatus, User} from "@prisma/client";
import {isPersonalRole} from "@/utils/roleRoutes";

type TGetActiveUserResult =
	| {error: true; response: NextResponse; user: null}
	| {
			error: false;
			user: User & {organisationId?: string; isApprovedNgo: boolean; donorId?: string; donorStatus?: DonorStatus};
			response?: undefined;
	  };

// getActiveUser + a role check in one call: `const {error, response, user} = await requireRole(["admin"]); if (error) return response;`
export async function requireRole(roles: string[]): Promise<TGetActiveUserResult> {
	const result = await getActiveUser();
	if (result.error) return result;

	if (!result.user.role || !roles.includes(result.user.role)) {
		return {error: true, response: NextResponse.json({error: "Unauthorized request"}, {status: 403}), user: null};
	}

	return result;
}

export async function getActiveUser(): Promise<TGetActiveUserResult> {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return {
				error: true,
				response: NextResponse.json({error: "Unauthorized"}, {status: 401}),
				user: null,
			};
		}

		// Find user by email since the session ID might not be properly set
		const dbUser = await prisma.user.findUnique({
			where: {email: session.user.email},
		});

		if (!dbUser || dbUser.status !== "active") {
			return {
				error: true,
				response: NextResponse.json({error: "User not found or inactive"}, {status: 404}),
				user: null,
			};
		}

		// If user is an NGO, fetch their linked organisation.
		// organisationId is only set once an admin has approved the NGO, so every NGO API that checks
		// `user.organisationId` is closed to pending NGOs (they still reach registration via its own lookup).
		let organisationId: string | undefined = undefined;
		let isApprovedNgo = false;

		if (dbUser.role === "ngo") {
			const organisation = await prisma.organisation.findFirst({
				where: {userId: dbUser.id},
				select: {id: true, approvedAt: true},
			});

			isApprovedNgo = !!organisation?.approvedAt;
			organisationId = isApprovedNgo ? organisation?.id : undefined;
		}

		// Requesters and donors can hold a donor profile
		let donorId: string | undefined = undefined;
		let donorStatus: DonorStatus | undefined = undefined;

		if (isPersonalRole(dbUser.role)) {
			const donor = await prisma.donor.findUnique({
				where: {userId: dbUser.id},
				select: {id: true, status: true},
			});

			donorId = donor?.id;
			donorStatus = donor?.status;
		}

		return {
			error: false,
			user: {
				...dbUser,
				organisationId,
				isApprovedNgo,
				donorId,
				donorStatus,
			},
		};
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return {
			error: true,
			response: NextResponse.json({error: errorMessage}, {status: 500}),
			user: null,
		};
	}
}
