import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../../../../../prisma/prisma";

import { getActiveUser } from "@/services/userService";

import { getErrorMessage } from "@/utils/getErrorMessage";

export async function GET(request: NextRequest) {
  try {
    const { error, response, user } = await getActiveUser();

    if (error) {
      return response;
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Unauthorized request",
        },
        {
          status: 403,
        },
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status") || "";

    const search = searchParams.get("search") || "";

    let statusCondition = "";

    if (status === "ACTIVE") {
      statusCondition = `
        AND ra.activity = 'REQUEST_SENT'
      `;
    }

    if (status === "ONGOING") {
      statusCondition = `
        AND ra.activity = 'DONORS_ASSIGNED'
      `;
    }

    if (status === "CLOSED") {
      statusCondition = `
        AND ra.activity = 'REQUEST_CLOSED'
      `;
    }

    let searchCondition = "";

    if (search.trim()) {
      searchCondition = `
        AND LOWER(r."patientName")
        LIKE LOWER('%${search}%')
      `;
    }

    const sql = `
      SELECT
        r.id,
        r."patientName",
        r."bloodGroup",
        r.urgency,
        r.hospital,
        r.units,
        r."updatedAt",

        CASE
          WHEN ra.activity = 'REQUEST_SENT'
            THEN 'ACTIVE'

          WHEN ra.activity = 'DONORS_ASSIGNED'
            THEN 'ONGOING'

          WHEN ra.activity = 'REQUEST_CLOSED'
            THEN 'CLOSED'

          ELSE 'ACTIVE'
        END AS status

      FROM "Request" r

      LEFT JOIN (
        SELECT DISTINCT ON ("requestId")
          "requestId",
          activity,
          "createdAt"
        FROM "RequestActivity"
        ORDER BY "requestId", "createdAt" DESC
      ) ra
      ON ra."requestId" = r.id

      WHERE 1=1

      ${statusCondition}

      ${searchCondition}

      ORDER BY r."updatedAt" DESC
    `;

    const requests = await prisma.$queryRawUnsafe(sql);

    return NextResponse.json(
      {
        requests,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);

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
