import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import * as Sentry from "@sentry/nextjs";
import {notifyDonors} from "@/services/notificationService";

function incrementSuffix(suffix: string) {
  let firstLetter = suffix[0];
  let secondLetter = suffix[1];
  let number = parseInt(suffix.slice(2), 10);

  if (number < 99) {
    number++;
    return `${firstLetter}${secondLetter}${number.toString().padStart(2, "0")}`;
  }

  number = 0;

  if (secondLetter < "Z") {
    secondLetter = String.fromCharCode(secondLetter.charCodeAt(0) + 1);
    return `${firstLetter}${secondLetter}00`;
  }

  secondLetter = "A";

  if (firstLetter < "Z") {
    firstLetter = String.fromCharCode(firstLetter.charCodeAt(0) + 1);
    return `${firstLetter}${secondLetter}00`;
  }

  throw new Error("Certificate number limit reached for the current month.");
}

async function generateCertificateNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const prefix = `NB${year}${month}`;

  const latestCertificate = await prisma.donationCertificate.findFirst({
    where: {
      certificateNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      certificateNumber: "desc",
    },
  });

  if (!latestCertificate) {
    return `${prefix}AA00`;
  }

  const suffix = latestCertificate.certificateNumber.slice(prefix.length);

  return `${prefix}${incrementSuffix(suffix)}`;
}

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

    const body = await req.json();

    if (!body?.requestDonorId) {
      return NextResponse.json(
        {
          error: "Request donor ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const requestDonor = await prisma.requestDonors.findFirst({
      where: {
        id: body.requestDonorId,
        organisationId: user.organisationId,
      },
      include: {
        DonationCertificate: true,

        Request: {
          include: {
            RequestActivity: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },

        Donor: true,
      },
    });

    if (!requestDonor) {
      return NextResponse.json(
        {
          error: "Request donor record not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (requestDonor.DonationCertificate) {
      return NextResponse.json(
        {
          error: "Certificate already generated.",
        },
        {
          status: 400,
        },
      );
    }

    const latestActivity = requestDonor.Request?.RequestActivity?.[0]?.activity;

    if (latestActivity !== "REQUEST_CLOSED") {
      return NextResponse.json(
        {
          error: "Certificate can only be generated after request closure.",
        },
        {
          status: 400,
        },
      );
    }

    const certificateNumber = await generateCertificateNumber();

    // Issuing the certificate is when the donation counts as verified: also record
    // the donor's last donation date (the day blood was needed, never in the future)
    // so their next-eligible date is right.
    const requirementDate = requestDonor.Request?.requirementDate;
    const donatedAt = requirementDate && requirementDate < new Date() ? requirementDate : new Date();
    const previousDonatedAt = requestDonor.Donor?.lastDonatedAt;

    const certificate = await prisma.$transaction(async (tx) => {
      const created = await tx.donationCertificate.create({
        data: {
          certificateNumber,
          requestDonorId: requestDonor.id,
        },
      });

      if (requestDonor.donorId && (!previousDonatedAt || previousDonatedAt < donatedAt)) {
        await tx.donor.update({
          where: {id: requestDonor.donorId},
          data: {lastDonatedAt: donatedAt},
        });
      }

      return created;
    });

    if (requestDonor.donorId) {
      await notifyDonors([requestDonor.donorId], {
        type: "CERTIFICATE_ISSUED",
        title: "Your donation certificate is ready",
        message: `Certificate ${certificate.certificateNumber} - thank you for donating blood!`,
        link: `/donor/certificates/${requestDonor.id}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        certificate,
      },
      {
        status: 201,
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
