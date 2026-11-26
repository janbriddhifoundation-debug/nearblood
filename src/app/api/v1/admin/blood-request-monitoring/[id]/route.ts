import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../../../../prisma/prisma";

import { getActiveUser } from "@/services/userService";

import { getErrorMessage } from "@/utils/getErrorMessage";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;

    const { error, response, user } = await getActiveUser();

    if (error) {
      return response;
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized request",
        },
        {
          status: 403,
        },
      );
    }

    const requestData = await prisma.request.findUnique({
      where: {
        id,
      },

      include: {
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

        user: true,
      },
    });

    if (!requestData) {
      return NextResponse.json(
        {
          error: "Request not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(requestData, {
      status: 200,
    });
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
