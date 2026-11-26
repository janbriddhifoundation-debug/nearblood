import {NextResponse} from "next/server";
import {Donor} from "@prisma/client";
import {prisma} from "../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {isPersonalRole} from "@/utils/roleRoutes";

type TGetActiveDonorResult = {error: true; response: NextResponse; donor: null} | {error: false; donor: Donor; response?: undefined};

// Resolves the donor profile linked to the signed-in personal account.
// Pass requireApproved=false for onboarding routes that pending/rejected donors may call.
export async function getActiveDonor({requireApproved = true}: {requireApproved?: boolean} = {}): Promise<TGetActiveDonorResult> {
	const {error, response, user} = await getActiveUser();
	if (error) return {error: true, response, donor: null};

	if (!isPersonalRole(user.role)) {
		return {error: true, response: NextResponse.json({error: "Only personal accounts can have a donor profile"}, {status: 403}), donor: null};
	}

	const donor = await prisma.donor.findUnique({where: {userId: user.id}});

	if (!donor) {
		return {error: true, response: NextResponse.json({error: "Donor profile not found"}, {status: 404}), donor: null};
	}

	if (requireApproved && donor.status !== "APPROVED") {
		return {error: true, response: NextResponse.json({error: "Your donor profile is waiting for NGO approval"}, {status: 403}), donor: null};
	}

	return {error: false, donor};
}

// Writes the PostGIS point for a donor (Prisma can't write geography columns)
export async function setDonorLocation(donorId: string, latitude: number, longitude: number) {
	await prisma.$executeRaw`
		UPDATE "Donor"
		SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
		WHERE id = ${donorId}
	`;
}

export function getDonorPhotoUrl(photo?: string | null): string | null {
	return photo ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donors/${photo}` : null;
}
