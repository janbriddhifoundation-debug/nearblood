import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import * as Sentry from "@sentry/nextjs";

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

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

    const from = searchParams.get("from");

    const to = searchParams.get("to");

    const exportCsv = searchParams.get("export") === "true";

    const page = Math.max(1, Number(searchParams.get("page") || 1));

    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 10)),
    );

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

        if (!donorAssignedActivity) {
          return null;
        }

        const assignedAt = donorAssignedActivity.createdAt;

        const derivedStatus =
          latestActivity === "REQUEST_CLOSED" ||
          latestActivity === "DONATION_PROOF_SUBMITTED"
            ? "REQUEST_CLOSED"
            : "DONOR_ASSIGNED";

        return {
          id: requestDonor.id,

          assignedAt,

          assignedAtFormatted: formatDate(assignedAt),

          patientName: requestDonor.Request?.patientName ?? "-",

          donorName: requestDonor.Donor?.name ?? "-",

          bloodGroup: requestDonor.Donor?.bloodGroup ?? "-",

          requestContact: requestDonor.Request?.contact ?? "-",

          status: derivedStatus,

          request: {
            ...requestDonor.Request,

            donors:
              requestDonor.Request?.RequestDonors?.map((item) => ({
                photo: item.Donor?.photo
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donors/${item.Donor.photo}`
                  : null,

                name: item.Donor?.name ?? "-",

                bloodGroup: item.Donor?.bloodGroup ?? "-",

                phone: item.Donor?.phone ?? "-",

                address: item.Donor?.address ?? "-",
              })) ?? [],
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const filteredData = transformedData.filter((item) => {
      if (status) {
        const allowedStatuses = ["DONOR_ASSIGNED", "REQUEST_CLOSED"];

        if (!allowedStatuses.includes(status)) {
          return false;
        }

        if (item.status !== status) {
          return false;
        }
      }

      const assignedDate = new Date(item.assignedAt);

      if (from) {
        const fromDate = new Date(from);

        if (isNaN(fromDate.getTime())) {
          return false;
        }

        fromDate.setHours(0, 0, 0, 0);

        if (assignedDate < fromDate) {
          return false;
        }
      }

      if (to) {
        const toDate = new Date(to);

        if (isNaN(toDate.getTime())) {
          return false;
        }

        toDate.setHours(23, 59, 59, 999);

        if (assignedDate > toDate) {
          return false;
        }
      }

      return true;
    });

    if (exportCsv) {
      const csvRows = [
        [
          "Date",
          "Patient Name",
          "Donor Name",
          "Blood Group",
          "Request Contact",
          "Status",
        ],
      ];

      filteredData.forEach((row) => {
        csvRows.push([
          row.assignedAtFormatted,
          row.patientName,
          row.donorName,
          row.bloodGroup,
          row.requestContact,
          row.status,
        ]);
      });

      const csvContent = csvRows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

      const csvWithBom = "\uFEFF" + csvContent;

      const timestamp = new Date().toISOString().split("T")[0];

      return new NextResponse(csvWithBom, {
        status: 200,

        headers: {
          "Content-Type": "text/csv; charset=utf-8",

          "Content-Disposition": `attachment; filename="donor-assignment-report-${timestamp}.csv"`,
        },
      });
    }

    const total = filteredData.length;

    const startIndex = (page - 1) * limit;

    const endIndex = startIndex + limit;

    const paginatedData = filteredData.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        success: true,

        reports: paginatedData,

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
