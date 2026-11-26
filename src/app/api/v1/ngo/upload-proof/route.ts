import { getActiveUser } from "@/services/userService";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../prisma/prisma";
import { getErrorMessage } from "@/utils/getErrorMessage";

export async function POST(req: NextRequest) {
  try {
    const { error, response, user } = await getActiveUser();

    if (error) {
      return response;
    }

    if (!user?.organisationId) {
      return NextResponse.json(
        {
          error: "Unauthorized request",
        },
        {
          status: 403,
        },
      );
    }

    const parsedData = await req.json();

    if (!parsedData?.requestId) {
      return NextResponse.json(
        {
          error: "Request ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!parsedData?.fileNames?.length) {
      return NextResponse.json(
        {
          error: "Please upload at least one file.",
        },
        {
          status: 400,
        },
      );
    }

    const requestDonor = await prisma.requestDonors.findFirst({
      where: {
        requestId: parsedData.requestId,
        organisationId: user.organisationId,
      },
    });

    if (!requestDonor) {
      return NextResponse.json(
        {
          error: "You do not have permission to upload proof for this request.",
        },
        {
          status: 403,
        },
      );
    }

    const existingProof = await prisma.donationProof.findFirst({
      where: {
        requestId: parsedData.requestId,
      },
    });

    if (existingProof) {
      return NextResponse.json(
        {
          error: "Donation proof already uploaded for this request.",
        },
        {
          status: 400,
        },
      );
    }

    const donationProofData = parsedData.fileNames.map((fileName: string) => ({
      requestId: parsedData.requestId,
      filekey: fileName,
    }));

    const [insertedData] = await Promise.all([
      prisma.donationProof.createManyAndReturn({
        data: donationProofData,
      }),

      prisma.upload.updateMany({
        where: {
          filekey: {
            in: parsedData.fileNames,
          },
        },
        data: {
          type: "BLOOD_DONATION_PROOF",
        },
      }),
    ]);

    if (parsedData.feedback) {
      await prisma.request.update({
        where: {
          id: parsedData.requestId,
        },
        data: {
          feedback: parsedData.feedback,
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
      {
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}
