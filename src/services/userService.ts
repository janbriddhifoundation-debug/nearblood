import {auth} from "@/auth";
import {NextResponse} from "next/server";
import {prisma} from "../../prisma/prisma";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {User} from "@prisma/client";

type TGetActiveUserResult =
	| {error: true; response: NextResponse; user: null}
	| {
			error: false;
			user: User & {organisationId?: string; isApprovedNgo: boolean};
			response?: undefined;
	  };

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

		// If user is an NGO, fetch their linked organisation
		let organisationId: string | undefined = undefined;
		let isApprovedNgo = false;

		if (dbUser.role === "ngo") {
			const organisation = await prisma.organisation.findFirst({
				where: {userId: dbUser.id},
				select: {id: true, approvedAt: true},
			});

			if (organisation) {
				organisationId = organisation.id;
				isApprovedNgo = organisation.approvedAt !== null;
			}
		}

		return {
			error: false,
			user: {
				...dbUser,
				organisationId,
				isApprovedNgo,
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
