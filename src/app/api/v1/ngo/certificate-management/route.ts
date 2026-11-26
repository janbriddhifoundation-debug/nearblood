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

    const search = searchParams.get("search")?.trim() || "";

    const status = searchParams.get("status")?.trim() || "";

    const page = Number(searchParams.get("page") || 1);

    const limit = Number(searchParams.get("limit") || 10);

    const requestDonors = await prisma.requestDonors.findMany({
      where: {
        organisationId: user.organisationId,

        Request: {
          patientName: search
            ? {
                contains: search,
                mode: "insensitive",
              }
            : undefined,
        },
      },

      include: {
        Donor: true,

        DonationCertificate: true,

        Request: {
          include: {
            DonationProof: true,

            RequestActivity: {
              orderBy: {
                createdAt: "desc",
              },
            },

            RequestDonors: {
              include: {
                Donor: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedData = requestDonors
      .map((requestDonor) => {
        const activities = requestDonor.Request?.RequestActivity ?? [];

        const latestActivity = activities[0]?.activity ?? "UNKNOWN";

        const donorAssignedActivity = activities.find(
          (activity) => activity.activity === "DONORS_ASSIGNED",
        );

        return {
          id: requestDonor.id,

          assignedAt: donorAssignedActivity?.createdAt ?? null,

          donorName: requestDonor.Donor?.name ?? "-",

          patientName: requestDonor.Request?.patientName ?? "-",

          status:
            latestActivity === "REQUEST_CLOSED" ||
            latestActivity === "DONATION_PROOF_SUBMITTED"
              ? "REQUEST_CLOSED"
              : "DONOR_ASSIGNED",

          hasCertificate: !!requestDonor.DonationCertificate,

          certificateNumber:
            requestDonor.DonationCertificate?.certificateNumber ?? null,

          generatedAt: requestDonor.DonationCertificate?.generatedAt ?? null,

          request: {
            ...requestDonor.Request,

            donors:
              requestDonor.Request?.RequestDonors?.map((requestDonorItem) => ({
                photo: requestDonorItem.Donor?.photo
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donors/${requestDonorItem.Donor.photo}`
                  : null,

                name: requestDonorItem.Donor?.name ?? "-",

                bloodGroup: requestDonorItem.Donor?.bloodGroup ?? "-",

                phone: requestDonorItem.Donor?.phone ?? "-",

                address: requestDonorItem.Donor?.address ?? "-",
              })) ?? [],
          },
        };
      })
      .filter((item) => {
        const allowedStatuses = ["DONOR_ASSIGNED", "REQUEST_CLOSED"];

        const matchesAllowedStatus = allowedStatuses.includes(item.status);

        const matchesStatus = status ? item.status === status : true;

        return matchesAllowedStatus && matchesStatus;
      });

    const total = transformedData.length;

    const startIndex = (page - 1) * limit;

    const endIndex = startIndex + limit;

    const paginatedRequests = transformedData.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        success: true,

        requests: paginatedRequests,

        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
