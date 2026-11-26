import { NextResponse } from "next/server";

import { prisma } from "../../../../../../../prisma/prisma";

import { getActiveUser } from "@/services/userService";

import { getErrorMessage } from "@/utils/getErrorMessage";

type BloodRequestStats = {
  active: bigint | number;
  ongoing: bigint | number;
  closed: bigint | number;
};

export async function GET() {
  try {
    const { error, response, user } = await getActiveUser();

    if (error) return response;

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

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE ra.activity = 'REQUEST_SENT') AS active,
        COUNT(*) FILTER (WHERE ra.activity = 'DONORS_ASSIGNED') AS ongoing,
        COUNT(*) FILTER (WHERE ra.activity = 'REQUEST_CLOSED') AS closed
      FROM "Request" r
      LEFT JOIN (
        SELECT DISTINCT ON ("requestId")
          "requestId",
          activity
        FROM "RequestActivity"
        ORDER BY "requestId", "createdAt" DESC
      ) ra ON ra."requestId" = r.id
    `;

    const result = await prisma.$queryRawUnsafe<BloodRequestStats[]>(sql);

    const stats = result[0] || {
      active: 0,
      ongoing: 0,
      closed: 0,
    };

    return NextResponse.json(
      {
        active: Number(stats.active) || 0,
        ongoing: Number(stats.ongoing) || 0,
        closed: Number(stats.closed) || 0,
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
