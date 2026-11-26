import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { ngoEventSchema } from "@/validationSchema/NgoEventSchema";
import { notifyDonors } from "@/services/notificationService";

export async function POST(req: NextRequest) {
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
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 },
      );
    }

    const parsedData = await req.json();

    const validData = await ngoEventSchema.validate(parsedData, {
      abortEarly: false,
      stripUnknown: true,
    });

    const event = await prisma.ngoEvent.create({
      data: {
        organisationId: organisation.id,

        eventName: validData.eventName,
        purpose: validData.purpose,

        eventDate: validData.eventDate,

        venueName: validData.venueName,

        latitude: Number(validData.latitude),
        longitude: Number(validData.longitude),

        partnerBloodBank: validData.partnerBloodBank,

        donorsRequired: validData.donorsRequired,

        imageFilekey: validData.imageFilekey,

        notes: validData.notes,
      },
    });

    if (validData.latitude !== undefined && validData.longitude !== undefined) {
      await prisma.$executeRaw`
        UPDATE "NgoEvent"
        SET "location" =
          ST_SetSRID(
            ST_MakePoint(
              ${Number(validData.longitude)},
              ${Number(validData.latitude)}
            ),
            4326
          )
        WHERE "id" = ${event.id}
      `;
    }

    // Tell this NGO's active donors about the new camp
    const donors = await prisma.donor.findMany({
      where: { organisationId: organisation.id, status: "APPROVED", isAvailable: true, userId: { not: null } },
      select: { id: true },
    });
    await notifyDonors(
      donors.map((donor) => donor.id),
      {
        type: "CAMP_CREATED",
        title: `New blood camp: ${event.eventName}`,
        message: `${organisation.name ?? "Your NGO"} is holding a camp on ${event.eventDate.toDateString()}${event.venueName ? ` at ${event.venueName}` : ""}. Register if you can donate.`,
        link: "/donor/camps",
      },
    );

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 201 },
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
