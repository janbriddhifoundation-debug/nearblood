import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {requestSchema} from "@/validationSchema/requestSchema";
import dayjs from "dayjs";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {createRequestActivity} from "@/services/requestActivityService";

// Get all request & activities for the authenticated user
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const statusQuery = searchParams.get("status");

	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		let requestsWithActivities = await prisma.request.findMany({
			where: {
				userId: user.id,
			},
			include: {
				RequestActivity: {
					orderBy: {
						createdAt: "desc",
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		requestsWithActivities = requestsWithActivities.map((item) => {
			return {
				...item,
				status: item.RequestActivity[0]?.activity ?? "UNKNOWN",
			};
		});

		// If status=open, filter out requests that contain any REQUEST_CLOSED activity
		if (statusQuery === "open") {
			requestsWithActivities = requestsWithActivities.filter((item) => !item.RequestActivity.some((activity) => activity.activity === "REQUEST_CLOSED"));
		}

		return NextResponse.json({success: true, requests: requestsWithActivities}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}

// Create a new request
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		// For Testing --------------------
		// const user = {
		// 	id: "cmakm6d4e0002nikgfrika6j2",
		// };

		const parsedData = await req.json();

		const datePart = dayjs(parsedData?.requirementDate).format("YYYY-MM-DD");
		const timePart = dayjs(parsedData?.requirementTime).format("HH:mm:ss");
		const combinedDateTime = dayjs(`${datePart}T${timePart}`);
		const requirementDateTime = combinedDateTime.toDate();

		const validationResult = requestSchema.safeParse(parsedData);

		if (!validationResult.success) {
			// Return structured, field-level validation errors using Zod's flatten()
			const flattened = validationResult.error.flatten();

			return NextResponse.json(
				{
					success: false,
					errors: flattened.fieldErrors,
					formErrors: flattened.formErrors,
				},
				{status: 400},
			);
		}

		const newRequest = await prisma.request.create({
			data: {
				...validationResult.data,
				requirementDate: requirementDateTime,
				userId: user.id,
			},
		});

		await prisma.$executeRaw`
            UPDATE "Request"
            SET location = ST_SetSRID(ST_MakePoint(${parsedData.longitude}, ${parsedData.latitude}), 4326)
            WHERE id = ${newRequest.id}
        `;

		const {error: activityError, response: activityResponse} = await createRequestActivity({requestId: newRequest.id, activity: "REQUEST_SENT"});
		if (activityError) return activityResponse;

		return NextResponse.json({success: true, request: newRequest}, {status: 201});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
