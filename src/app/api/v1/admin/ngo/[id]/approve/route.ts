import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import {notifyOrganisation} from "@/services/notificationService";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { user } = await getActiveUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ngo = await prisma.organisation.findUnique({
    where: { id },
  });

  if (!ngo) {
    return NextResponse.json({ error: "NGO not found" }, { status: 404 });
  }

  const approvalTime = new Date();
  const approvalResult = await prisma.organisation.updateMany({
    where: {
      id,
      approvedAt: null,
    },
    data: {
      approvedAt: approvalTime,
    },
  });
  if (approvalResult.count === 0) {
    return NextResponse.json({ message: "Already approved" }, { status: 400 });
  }

  await notifyOrganisation(id, {
    type: "NGO_APPROVED",
    title: "Your organisation is approved",
    message: "You can now see blood requests near you, manage donors and run camps.",
    link: "/ngo/dashboard",
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
