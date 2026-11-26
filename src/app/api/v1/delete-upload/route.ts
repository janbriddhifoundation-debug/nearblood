import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import s3 from "@/utils/s3Client";
import {DeleteObjectCommand} from "@aws-sdk/client-s3";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../prisma/prisma";

const validTypes = ["TEMP_BLOOD_DONATION_PROOF", "TEMP_NGO_REG_CERTIFICATE", "TEMP_NGO_CONTACT_ID_PROOF", "TEMP_DONOR_PHOTO"];

export async function DELETE(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		let folder;
		const {filekey, type} = await req.json();

		if (!filekey) {
			return NextResponse.json({error: "Missing 'filekey' in request body"}, {status: 400});
		}

		if (!validTypes.includes(type)) {
			return NextResponse.json({error: "Invalid 'type' in request body"}, {status: 400});
		}

		const upload = await prisma.upload.findFirst({
			where: {
				userId: user.id,
				filekey,
				type,
			},
		});

		if (!!!upload?.id) {
			return NextResponse.json({error: "Invalid request!"}, {status: 400});
		}

		if (type === "TEMP_NGO_REG_CERTIFICATE") {
			folder = "ngo-reg-certificate";
		} else if (type === "TEMP_NGO_CONTACT_ID_PROOF") {
			folder = "ngo-contact-id-proof";
		} else if (type === "TEMP_BLOOD_DONATION_PROOF") {
			folder = "donation-proof";
		} else if (type === "TEMP_DONOR_PHOTO") {
			folder = "donors";
		}

		await s3.send(
			new DeleteObjectCommand({
				Bucket: process.env.R2_BUCKET_NAME!,
				Key: `${folder}/${filekey}`,
			}),
		);

		await prisma.upload.delete({
			where: {
				userId: user.id,
				filekey,
				type,
			},
		});

		return NextResponse.json({success: true}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
