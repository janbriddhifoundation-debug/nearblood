import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../prisma/prisma";
import { getActiveUser } from "@/services/userService";
import { getErrorMessage } from "@/utils/getErrorMessage";

type FormattedNgo = {
  id: string;
  name: string | null;
  type: string | null;
  regNo: string | null;
  estDate: Date | null;
  address: string | null;
  website: string | null;
  regCert: string | null;
  createdAt: Date | null;
  approvedAt: Date | null;

  user: {
    name: string | null | undefined;
    email: string | null | undefined;
  };

  contact: {
    name: string | null;
    designation: string | null;
    email: string | null;
    phone: string | null;
    govtIdFilename: string | null;
  } | null;

  regions: {
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
  }[];
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { error, response, user } = await getActiveUser();
    if (error) return response;

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const ngo = await prisma.organisation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        OrganisationContact: true,
        OrganisationRegion: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const formattedNgo: FormattedNgo = {
      id: ngo.id,
      name: ngo.name,
      type: ngo.type,
      regNo: ngo.regNo,
      estDate: ngo.estDate,
      address: ngo.address,
      website: ngo.website,
      regCert: ngo.regCertFilename
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/ngo-reg-certificate/${ngo.regCertFilename}`
        : null,
      createdAt: ngo.createdAt,
      approvedAt: ngo.approvedAt,

      user: {
        name: ngo.user?.name,
        email: ngo.user?.email,
      },

      contact: ngo.OrganisationContact?.[0]
        ? {
            name: ngo.OrganisationContact[0].name,
            designation: ngo.OrganisationContact[0].designation,
            email: ngo.OrganisationContact[0].email,
            phone: ngo.OrganisationContact[0].phone,
            govtIdFilename: ngo.OrganisationContact[0].govtIdFilename,
          }
        : null,

      regions:
        ngo.OrganisationRegion?.map((r) => ({
          locationName: r.locationName,
          latitude: r.latitude,
          longitude: r.longitude,
        })) || [],
    };

    return NextResponse.json(
      { success: true, data: formattedNgo },
      { status: 200 },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
