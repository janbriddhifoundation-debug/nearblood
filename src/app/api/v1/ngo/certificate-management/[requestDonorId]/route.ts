import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import * as Sentry from "@sentry/nextjs";

type RouteParams = {
  params: Promise<{
    requestDonorId: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const { requestDonorId } = await params;

    const requestDonor = await prisma.requestDonors.findFirst({
      where: {
        id: requestDonorId,
        organisationId: user.organisationId,
      },
      include: {
        DonationCertificate: true,

        Donor: true,

        Organisation: true,

        Request: true,
      },
    });

    if (!requestDonor) {
      return NextResponse.json(
        {
          error: "Certificate record not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!requestDonor.DonationCertificate) {
      return NextResponse.json(
        {
          error: "Certificate has not been generated yet.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        certificate: {
          id: requestDonor.DonationCertificate.id,

          certificateNumber: requestDonor.DonationCertificate.certificateNumber,

          generatedAt: requestDonor.DonationCertificate.generatedAt,

          donorName: requestDonor.Donor?.name ?? "",

          donorBloodGroup: requestDonor.Donor?.bloodGroup ?? "",

          patientName: requestDonor.Request?.patientName ?? "",

          hospital: requestDonor.Request?.hospital ?? "",

          bloodGroup: requestDonor.Request?.bloodGroup ?? "",

          requirementDate: requestDonor.Request?.requirementDate ?? null,

          organisationName: requestDonor.Organisation?.name ?? "",

          requestId: requestDonor.Request?.id ?? "",
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    Sentry.captureException(error);

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
