import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { getErrorMessage } from "@/utils/getErrorMessage";
import s3 from "@/utils/s3Client";
import { getActiveUser } from "@/services/userService";
import { prisma } from "../../../../../prisma/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VALID_TYPES = [
  "TEMP_BLOOD_DONATION_PROOF",
  "TEMP_NGO_REG_CERTIFICATE",
  "TEMP_NGO_CONTACT_ID_PROOF",
  "TEMP_DONOR_PHOTO",
  "TEMP_NGO_EVENT_IMAGE",
  "TEMP_SUPPORT_PAYMENT",
];

export async function POST(req: NextRequest) {
  try {
    const { error, response, user } = await getActiveUser();
    if (error) return response;

    let folder;
    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!type || typeof type !== "string" || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid or missing 'type'" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExtension = file.type.split("/")[1];
    const filekey = `${createId()}.${fileExtension}`;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    if (type === "TEMP_NGO_REG_CERTIFICATE") {
      folder = "ngo-reg-certificate";
    } else if (type === "TEMP_NGO_CONTACT_ID_PROOF") {
      folder = "ngo-contact-id-proof";
    } else if (type === "TEMP_BLOOD_DONATION_PROOF") {
      folder = "donation-proof";
    } else if (type === "TEMP_DONOR_PHOTO") {
      folder = "donors";
    } else if (type === "TEMP_NGO_EVENT_IMAGE") {
      folder = "ngo-events";
    } else if (type === "TEMP_SUPPORT_PAYMENT") {
      folder = "support-payments";
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `${folder}/${filekey}`,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    await prisma.upload.create({
      data: {
        userId: user.id,
        filekey,
        type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        filekey,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/${folder}/${filekey}`,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
