import {getActiveUser} from "@/services/userService";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../../prisma/prisma";
import {getErrorMessage} from "@/utils/getErrorMessage";

export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		const parsedData = await req.json();

		if (!parsedData?.requestId) {
			return NextResponse.json({error: "Request ID is required."}, {status: 400});
		}

		if (parsedData?.fileNames?.length === 0) {
			return NextResponse.json({error: "Please upload at least one file."}, {status: 400});
		}

		const request = await prisma.request.findUnique({
			where: {
				id: parsedData.requestId,
				userId: user.id,
			},
		});
		if (!request) {
			return NextResponse.json({error: "Request not found or you do not have permission to access it."}, {status: 404});
		}

		const data = parsedData?.fileNames?.map((fileName: string) => ({
			requestId: parsedData.requestId,
			filekey: fileName,
		}));

		const [insertedData] = await Promise.all([
			prisma.donationProof.createManyAndReturn({
				data,
			}),
			prisma.upload.updateMany({
				where: {
					userId: user?.id,
					filekey: {
						in: parsedData?.fileNames,
					},
				},
				data: {
					type: "BLOOD_DONATION_PROOF",
				},
			}),
		]);

		if (parsedData?.feedback) {
			await prisma.request.update({
				where: {
					id: parsedData.requestId,
				},
				data: {
					feedback: parsedData.feedback ?? null,
					updatedAt: new Date(),
				},
			});
		}

		await prisma.requestActivity.create({
			data: {
				requestId: parsedData.requestId,
				activity: "DONATION_PROOF_SUBMITTED",
			},
		});

		await prisma.requestActivity.create({
			data: {
				requestId: parsedData.requestId,
				activity: "REQUEST_CLOSED",
			},
		});

		return NextResponse.json(
			{
				success: true,
				data: insertedData,
			},
			{status: 200},
		);
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
