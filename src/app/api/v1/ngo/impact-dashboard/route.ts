import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from");

    const to = searchParams.get("to");

    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (from) {
      fromDate = new Date(from);

      if (!isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
      } else {
        fromDate = null;
      }
    }

    if (to) {
      toDate = new Date(to);

      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
      } else {
        toDate = null;
      }
    }

    const organisationId = user.organisationId;

    const [requestDonors, donationCertificates, totalDonors] =
      await Promise.all([
        prisma.requestDonors.findMany({
          where: {
            organisationId,
          },

          include: {
            Request: {
              include: {
                RequestActivity: true,
              },
            },
          },
        }),

        prisma.donationCertificate.findMany({
          where: {
            RequestDonor: {
              organisationId,
            },
          },

          include: {
            RequestDonor: {
              include: {
                Request: true,
              },
            },
          },
        }),

        prisma.donor.count({
          where: {
            organisationId,
          },
        }),
      ]);

    const donorAssignedRequestIds = new Set<string>();

    requestDonors.forEach((requestDonor) => {
      const request = requestDonor.Request;

      if (!request?.id) {
        return;
      }

      const donorAssignedActivity = request.RequestActivity.find(
        (activity) => activity.activity === "DONORS_ASSIGNED",
      );

      if (!donorAssignedActivity) {
        return;
      }

      const activityDate = donorAssignedActivity.createdAt;

      if (fromDate && activityDate < fromDate) {
        return;
      }

      if (toDate && activityDate > toDate) {
        return;
      }

      donorAssignedRequestIds.add(request.id);
    });

    const requestClosedRequestIds = new Set<string>();

    requestDonors.forEach((requestDonor) => {
      const request = requestDonor.Request;

      if (!request?.id) {
        return;
      }

      const donationProofSubmittedActivity = request.RequestActivity.find(
        (activity) => activity.activity === "DONATION_PROOF_SUBMITTED",
      );

      if (!donationProofSubmittedActivity) {
        return;
      }

      const activityDate = donationProofSubmittedActivity.createdAt;

      if (fromDate && activityDate < fromDate) {
        return;
      }

      if (toDate && activityDate > toDate) {
        return;
      }

      requestClosedRequestIds.add(request.id);
    });

    const certificateRequestIds = new Set<string>();

    donationCertificates.forEach((certificate) => {
      const requestId = certificate.RequestDonor?.requestId;

      if (!requestId) {
        return;
      }

      const generatedAt = certificate.generatedAt;

      if (fromDate && generatedAt < fromDate) {
        return;
      }

      if (toDate && generatedAt > toDate) {
        return;
      }

      certificateRequestIds.add(requestId);
    });

    return NextResponse.json(
      {
        success: true,

        stats: {
          donorsAssigned: donorAssignedRequestIds.size,

          requestsClosed: requestClosedRequestIds.size,

          certificatesGenerated: certificateRequestIds.size,

          totalDonors,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}
