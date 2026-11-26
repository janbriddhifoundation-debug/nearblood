import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {assignDonorsSchema} from "@/validationSchema/NgoSchema";
import {ValidationError} from "yup";
import * as Sentry from "@sentry/nextjs";
import {createRequestActivity} from "@/services/requestActivityService";

// Assign donor to request
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!!!user?.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		// const user = {
		// 	organisationId: "cmc8rso8f000pniv8622ibasj",
		// };

		const parsedData = await req.json(); // donorIds, requestId

		try {
			await assignDonorsSchema.validate(parsedData, {abortEarly: false});
		} catch (error: unknown) {
			if (error instanceof ValidationError) {
				const errors = error.inner.reduce((acc: Record<string, string>, err) => {
					if (err.path) acc[err.path] = err.message;
					return acc;
				}, {});
				return NextResponse.json({error: "Validation failed", details: errors}, {status: 400});
			}
			throw error;
		}

		// Only this NGO's approved donors can be assigned
		const assignableCount = await prisma.donor.count({
			where: {id: {in: parsedData.donorIds}, organisationId: user.organisationId, status: "APPROVED"},
		});

		if (assignableCount !== parsedData.donorIds.length) {
			return NextResponse.json({error: "Some selected donors are not approved donors of your organisation"}, {status: 400});
		}

		await prisma.requestDonors.createMany({
			data: parsedData.donorIds.map((donorId: string) => ({
				donorId,
				requestId: parsedData.requestId,
				organisationId: user.organisationId,
			})),
		});

		const {error: activityError, response: activityResponse} = await createRequestActivity({requestId: parsedData.requestId, activity: "DONORS_ASSIGNED"});
		if (activityError) return activityResponse;

		return NextResponse.json({success: true}, {status: 201});
	} catch (error) {
		console.error(error);
		Sentry.captureException(error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
