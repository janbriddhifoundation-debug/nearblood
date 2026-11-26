import {NextResponse} from "next/server";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {prisma} from "../../../../../../../prisma/prisma";

// Get all request
export async function GET(_request: Request, props: {params: Promise<{id: string}>}) {
	const params = await props.params;
	const {id} = params;
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		const requestWithActivity = await prisma.request.findFirst({
			where: {
				userId: user.id,
				id,
			},
			include: {
				RequestActivity: {
					select: {
						activity: true,
						createdAt: true,
					},
					take: 1,
					orderBy: {
						createdAt: "desc",
					},
				},
				DonationProof: {
					select: {
						filekey: true,
					},
				},
				RequestDonors: {
					include: {
						Donor: {
							select: {
								id: true,
								name: true,
								gender: true,
								phone: true,
								bloodGroup: true,
								address: true,
								photo: true,
							},
						},
						Organisation: {
							select: {
								id: true,
								name: true,
								type: true,
								regNo: true,
								address: true,
								website: true,
							},
						},
					},
				},
			},
		});

		const transformedRequest = {
			...requestWithActivity,
			DonationProof: requestWithActivity?.DonationProof?.map((proof) => ({
				url: `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donation-proof/${proof.filekey}`,
			})),
			RequestDonors: requestWithActivity?.RequestDonors?.map((rd) => ({
				...rd,
				Donor: {
					...rd.Donor,
					photo: rd.Donor?.photo ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donors/${rd.Donor.photo}` : null,
				},
			})),
			status: requestWithActivity?.RequestActivity?.[0]?.activity ?? "UNKNOWN",
		};

		return NextResponse.json({success: true, request: transformedRequest}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
