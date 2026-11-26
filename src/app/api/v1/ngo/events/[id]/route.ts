import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { eventStatusSchema } from "@/validationSchema/campSchema";

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
        // Only approved NGOs can run camps
        approvedAt: { not: null },
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

// NGO changes a camp's status (ACTIVE -> ONGOING on the day -> CLOSED after)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { error, response, user } = await getActiveUser();
    if (error) return response;

    if (!user.organisationId) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 403 });
    }

    const validationResult = eventStatusSchema.safeParse(await req.json());

    if (!validationResult.success) {
      const flattened = validationResult.error.flatten();
      return NextResponse.json({ success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors }, { status: 400 });
    }

    const { id } = await params;
    const result = await prisma.ngoEvent.updateMany({
      where: { id, organisationId: user.organisationId },
      data: { status: validationResult.data.status },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: validationResult.data.status }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
