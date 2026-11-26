import {NextResponse} from "next/server";
import {prisma} from "../../prisma/prisma";
import {getErrorMessage} from "@/utils/getErrorMessage";

export async function createRequestActivity({requestId, activity}: {requestId: string; activity: string}) {
	try {
		const newActivity = await prisma.requestActivity.create({
			data: {
				activity,
				requestId,
			},
		});

		return {
			error: false,
			activity: newActivity,
		};
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return {
			error: true,
			response: NextResponse.json({error: errorMessage}, {status: 500}),
			activity: null,
		};
	}
}
