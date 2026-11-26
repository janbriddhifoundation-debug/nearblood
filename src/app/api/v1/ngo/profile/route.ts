import { NextResponse } from "next/server";
import { prisma } from "../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";

export async function GET() {
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

    const organisation = await prisma.organisation.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        OrganisationContact: {
          orderBy: {
            createdAt: "asc",
          },
        },
        OrganisationRegion: {
          orderBy: {
            createdAt: "asc",
          },
        },
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

    return NextResponse.json(
      {
        success: true,
        organisation,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
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
