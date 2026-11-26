import {NextResponse} from "next/server";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {prisma} from "../../../../../prisma/prisma";

export async function GET() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user) {
			return NextResponse.json({error: "User not found"}, {status: 404});
		}

		const userDetails = await prisma.user.findUnique({
			where: {id: user.id},
			include: {Organisation: true},
		});

		const formattedUser = {
			id: userDetails?.id,
			name: userDetails?.name,
			email: userDetails?.email,
			image: userDetails?.image,
			role: userDetails?.role,
			isApprovedNgo: userDetails?.Organisation?.[0]?.approvedAt ? true : false,
			organisation: userDetails?.Organisation[0],
		};

		return NextResponse.json({success: true, user: formattedUser}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
