import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getErrorMessage } from "@/utils/getErrorMessage";
import * as Sentry from "@sentry/nextjs";

type RouteParams = {
  params: Promise<{
    certificateNumber: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { certificateNumber } = await params;

    const certificate = await prisma.donationCertificate.findUnique({
      where: {
        certificateNumber,
      },
      include: {
        RequestDonor: {
          include: {
            Donor: true,
            Organisation: true,
            Request: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          valid: false,
          error: "Certificate not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        valid: true,

        certificate: {
          certificateNumber: certificate.certificateNumber,

          generatedAt: certificate.generatedAt,

          donorName: certificate.RequestDonor?.Donor?.name ?? "",

          donorBloodGroup: certificate.RequestDonor?.Donor?.bloodGroup ?? "",

          patientName: certificate.RequestDonor?.Request?.patientName ?? "",

          hospital: certificate.RequestDonor?.Request?.hospital ?? "",

          bloodGroup: certificate.RequestDonor?.Request?.bloodGroup ?? "",

          organisationName: certificate.RequestDonor?.Organisation?.name ?? "",

          requestId: certificate.RequestDonor?.Request?.id ?? "",
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
        valid: false,
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}
