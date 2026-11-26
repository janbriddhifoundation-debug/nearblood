import {NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {convertBigIntToNumber} from "@/utils/bigintUtils";

// Get all donors of the ngo
export async function GET() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!!!user?.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const donorsCountQuery = await prisma.$queryRawUnsafe(
			`
           SELECT
            COUNT(d.id) AS "donorCount"
            FROM "Donor" d
            WHERE d."organisationId" = $1
        `,
			user?.organisationId,
		);

		const donorsCountResult = convertBigIntToNumber(donorsCountQuery as Array<{donorCount: bigint}>) as unknown as Array<{donorCount: number}>;
		const donorsCount = donorsCountResult[0]?.donorCount || 0;

		const organisationRegions = await prisma.organisationRegion.findMany({
			select: {
				latitude: true,
				longitude: true,
			},
			where: {
				organisationId: user?.organisationId,
			},
		});

		const coordinates = organisationRegions.map((region) => ({
			lat: region.latitude,
			lon: region.longitude,
		}));

		// Build the WHERE clause dynamically
		const geoConditions = coordinates
			.map((_, index) => {
				const base = index * 2 + 1;
				return `ST_DWithin(r.location::geography, ST_SetSRID(ST_Point($${base}, $${base + 1}), 4326)::geography, $${coordinates.length * 2 + 1})`;
			})
			.join(" OR ");

		const whereConditions = geoConditions;
		const values = coordinates.flatMap(({lon, lat}) => [lon, lat]);
		values.push(10000); // radius

		// Build the final SQL query
		const sql = `
		   SELECT
			COUNT(r.id) AS "requestCount"
            FROM "Request" r
			WHERE ${whereConditions}
		`;

		// Execute the query
		const requestsData = await prisma.$queryRawUnsafe(sql, ...values);

		// Convert BigInt values to numbers for JSON serialization
		const transformedData = convertBigIntToNumber(requestsData as Array<{requestCount: bigint}>) as unknown as Array<{requestCount: number}>;

		// Extract the count from the first (and only) row
		const requestsCount = transformedData[0]?.requestCount || 0;

		return NextResponse.json({success: true, requestsCount, donorsCount}, {status: 200});
	} catch (error) {
		console.error("Error in NGO dashboard GET:", error);
		// Sentry.captureException(error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
