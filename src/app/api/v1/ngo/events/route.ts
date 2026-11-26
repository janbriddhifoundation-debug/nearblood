import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { NgoEventStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error, response, user } = await getActiveUser();

    if (error) {
      return response;
    }

    if (user?.role !== "ngo") {
      return NextResponse.json(
        { error: "User is not an NGO" },
        { status: 403 },
      );
    }

    const organisation = await prisma.organisation.findFirst({
      where: {
        userId: user.id,
        // Only approved NGOs can run camps
        approvedAt: { not: null },
      },
      select: {
        id: true,
      },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 },
      );
    }

    const searchParams = req.nextUrl.searchParams;

    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 10);

    const search = searchParams.get("search")?.trim();

    const status = searchParams.get("status");

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.NgoEventWhereInput = {
      organisationId: organisation.id,
    };

    if (search) {
      where.OR = [
        {
          eventName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          purpose: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          venueName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          partnerBloodBank: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (
      status &&
      Object.values(NgoEventStatus).includes(status as NgoEventStatus)
    ) {
      where.status = status as NgoEventStatus;
    }

    if (startDate || endDate) {
      where.eventDate = {};

      if (startDate) {
        where.eventDate.gte = new Date(startDate);
      }

      if (endDate) {
        where.eventDate.lte = new Date(endDate);
      }
    }

    const [events, total] = await Promise.all([
      prisma.ngoEvent.findMany({
        where,
        orderBy: {
          eventDate: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      prisma.ngoEvent.count({
        where,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: events,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
