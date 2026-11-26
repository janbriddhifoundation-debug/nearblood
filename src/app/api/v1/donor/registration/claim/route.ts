import {NextResponse} from "next/server";
import {prisma} from "../../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {isPersonalRole} from "@/utils/roleRoutes";

// Links a donor record an NGO already created (same email as the Google account) to this login.
// The record keeps its NGO and approval status, so the donor goes straight to their dashboard.
export async function POST() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!isPersonalRole(user.role)) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const ownDonor = await prisma.donor.findUnique({where: {userId: user.id}, select: {id: true, status: true}});

		if (ownDonor && ownDonor.status !== "REJECTED") {
			return NextResponse.json({error: "Your account is already linked to a donor profile"}, {status: 409});
		}

		const claimable = await prisma.donor.findFirst({
			where: {email: {equals: user.email, mode: "insensitive"}, userId: null},
			select: {id: true},
		});

		if (!claimable) {
			return NextResponse.json({error: "No NGO donor record found for your email"}, {status: 404});
		}

		const donor = await prisma.$transaction(async (tx) => {
			// A rejected self sign-up is replaced by the NGO's record
			if (ownDonor) {
				await tx.donor.delete({where: {id: ownDonor.id}});
			}

			return tx.donor.update({
				where: {id: claimable.id},
				data: {userId: user.id},
				select: {id: true, status: true},
			});
		});

		return NextResponse.json({success: true, donor}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
