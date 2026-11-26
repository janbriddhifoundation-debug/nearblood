import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {donorRegSchema} from "@/validationSchema/NgoSchema";
import {ValidationError} from "yup";
import * as Sentry from "@sentry/nextjs";
import {DonorStatus, Prisma} from "@prisma/client";
import {getDonorPhotoUrl} from "@/services/donorService";

// Get all donors of the ngo
export async function GET(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!!!user?.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		// Get query params. bloodGroups may come as repeated params or one comma-separated value.
		const {searchParams} = new URL(req.url);
		const bloodGroups = searchParams
			.getAll("bloodGroups")
			.flatMap((value) => value.split(","))
			.filter(Boolean);
		const searchTerm = searchParams.get("searchTerm") || "";
		// Only approved donors unless a status is asked for, so pending sign-ups can't be assigned to requests
		const statusParam = searchParams.get("status");
		const status = statusParam && Object.values(DonorStatus).includes(statusParam as DonorStatus) ? (statusParam as DonorStatus) : DonorStatus.APPROVED;

		const where: Prisma.DonorWhereInput = {
			organisationId: user.organisationId,
			status,
		};

		if (bloodGroups.length > 0) {
			where.bloodGroup = {in: bloodGroups};
		}

		if (searchTerm) {
			where.name = {contains: searchTerm, mode: "insensitive"};
		}

		const [donors, statusCounts] = await Promise.all([
			prisma.donor.findMany({where, orderBy: {createdAt: "desc"}}),
			prisma.donor.groupBy({by: ["status"], where: {organisationId: user.organisationId}, _count: {_all: true}}),
		]);

		const counts = Object.values(DonorStatus).reduce<Record<string, number>>((acc, value) => {
			acc[value] = statusCounts.find((item) => item.status === value)?._count._all ?? 0;
			return acc;
		}, {});

		const transformedData = donors.map((donor) => ({
			...donor,
			photo: getDonorPhotoUrl(donor.photo),
		}));

		return NextResponse.json({success: true, donors: transformedData, counts}, {status: 200});
	} catch (error) {
		Sentry.captureException(error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}

// Add new Donor
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!!!user?.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const parsedData = await req.json();

		try {
			await donorRegSchema.validate(parsedData, {abortEarly: false});
		} catch (error: unknown) {
			if (error instanceof ValidationError) {
				const errors = error.inner.reduce((acc: Record<string, string>, err) => {
					if (err.path) acc[err.path] = err.message;
					return acc;
				}, {});
				return NextResponse.json({error: "Validation failed", details: errors}, {status: 400});
			}
			throw error;
		}

		// Only the form's fields - never status, userId or source from the request body
		const {name, gender, email, phone, dob, bloodGroup, address, photo, lastDonatedAt} = parsedData;

		const newDonor = await prisma.donor.create({
			data: {
				name,
				gender,
				email,
				phone,
				bloodGroup,
				address,
				photo,
				dob: new Date(dob),
				lastDonatedAt: lastDonatedAt ? new Date(lastDonatedAt) : null,
				organisationId: user.organisationId,
			},
		});

		return NextResponse.json({success: true, request: newDonor}, {status: 201});
	} catch (error) {
		console.error(error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
