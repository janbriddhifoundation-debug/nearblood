import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {donorRegSchema} from "@/validationSchema/NgoSchema";
import {ValidationError} from "yup";
import * as Sentry from "@sentry/nextjs";
import {Prisma} from "@prisma/client";

// Get all donors of the ngo
export async function GET(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!!!user?.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		// Get query params
		const {searchParams} = new URL(req.url);
		const bloodGroups = searchParams.getAll("bloodGroups");
		const searchTerm = searchParams.get("searchTerm") || "";

		console.log({bloodGroups, searchTerm});

		const where: Prisma.DonorWhereInput = {
			organisationId: user.organisationId,
		};

		if (bloodGroups.length > 0) {
			where.bloodGroup = {in: bloodGroups};
		}

		if (searchTerm) {
			where.name = {contains: searchTerm, mode: "insensitive"};
		}

		const donors = await prisma.donor.findMany({where});

		const transformedData = donors.map((donor) => ({
			...donor,
			photo: donor.photo ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donors/${donor.photo}` : null,
		}));

		return NextResponse.json({success: true, donors: transformedData}, {status: 200});
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

		const newDonor = await prisma.donor.create({
			data: {
				...parsedData,
				dob: new Date(parsedData.dob),
				organisationId: user.organisationId,
			},
		});

		return NextResponse.json({success: true, request: newDonor}, {status: 201});
	} catch (error) {
		console.log(error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
