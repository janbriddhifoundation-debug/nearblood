import { NextResponse } from "next/server";
import { prisma } from "@/../prisma/prisma";
import { getActiveUser } from "@/services/userService";

export async function GET() {
  try {
    const { user } = await getActiveUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [total, approved, pending] = await Promise.all([
      prisma.organisation.count(),

      prisma.organisation.count({
        where: {
          approvedAt: {
            not: null,
          },
        },
      }),

      prisma.organisation.count({
        where: {
          approvedAt: null,
        },
      }),
    ]);

    return NextResponse.json(
      {
        total,
        approved,
        pending,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Stats error:", error);

    return NextResponse.json(
      { error: "Failed to fetch NGO stats" },
      { status: 500 },
    );
  }
}
