import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { error, response, user } = await getActiveUser();

    if (error) {
      return response;
    }

    if (user?.role !== "ngo") {
      return NextResponse.json(
        {
          error: "User is not an NGO",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const organisation = await prisma.organisation.findFirst({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!organisation) {
      return NextResponse.json(
        {
          error: "Organisation not found",
        },
        {
          status: 404,
        },
      );
    }

    const event = await prisma.ngoEvent.findFirst({
      where: {
        id,
        organisationId: organisation.id,
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          error: "Event not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        event,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
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
