import {NextResponse} from "next/server";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
// import * as Sentry from "@sentry/nextjs";

// Get all blood requests
export async function GET(req: Request) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!!!user?.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

	const organisationRegions = await prisma.organisationRegion.findMany({
			select: {
				latitude: true,
				longitude: true,
			},
			where: {
				organisationId: user?.organisationId,
			},
		});

		const coordinates = organisationRegions
			.map((region) => ({
				lat: region.latitude,
				lon: region.longitude,
			}))
			.filter((c): c is { lat: number; lon: number } => c.lat != null && c.lon != null);

		if (coordinates.length === 0) {
			return NextResponse.json({success: true, requests: []}, {status: 200});
		}

		// Get search param
		const {searchParams} = new URL(req.url);
		const search = searchParams.get("search")?.trim();

		// Build the WHERE clause dynamically
		const geoConditions = coordinates
			.map((_, index) => {
				const base = index * 2 + 1;
				return `ST_DWithin(r.location::geography, ST_SetSRID(ST_Point($${base}, $${base + 1}), 4326)::geography, $${coordinates.length * 2 + 1})`;
			})
			.join(" OR ");

		// Add search filter if present
		let whereConditions = geoConditions;
	const values: (string | number)[] = coordinates.flatMap(({lon, lat}) => [lon, lat]);
	values.push(10000); // radius
		const paramIdx = values.length + 1;
		if (search) {
			whereConditions = `(${geoConditions}) AND (
				r."patientName" ILIKE $${paramIdx}
				OR r.hospital ILIKE $${paramIdx}
			)`;
			values.push(`%${search}%`);
		}

		// Build the final SQL query
		const sql = `
		   SELECT
			ra.activity AS "lastActivity",
			r.id,
			r."patientName",
			r.age,
			r.gender,
			r."patientAddress",
			r."relWRequester",
			r."hospitalRegNo",
			r."bloodGroup",
			r.urgency,
			r.reason,
			r.hospital,
			r."locationName",
			r."requirementDate",
			r.contact,
			r.notes,
			r."createdAt",
			r.latitude,
			r.longitude,
			r.units,
			COALESCE(
				json_agg(d) FILTER (WHERE d.id IS NOT NULL),
				'[]'
			) AS donors
			FROM "Request" r
			LEFT JOIN (
				SELECT DISTINCT ON ("requestId")
					"requestId",
					activity
				FROM "RequestActivity"
				ORDER BY "requestId", "createdAt" DESC
			) ra ON ra."requestId" = r.id
			LEFT JOIN "RequestDonors" rd ON rd."requestId" = r.id
			LEFT JOIN "Donor" d ON d.id = rd."donorId"
			WHERE ${whereConditions}
			GROUP BY
			r.id,
			ra.activity
			ORDER BY "createdAt" DESC
		`;

		// Execute the query
		const requests = await prisma.$queryRawUnsafe(sql, ...values);

		/* eslint-disable @typescript-eslint/no-explicit-any */
		const transformedData = (requests as any[] | undefined)?.map((request: any) => ({
			...request,
			donors: (request?.donors as any[] | undefined)?.map((donor: any) => ({
				...donor,
				photo: donor.photo ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/donors/${donor.photo}` : null,
			})),
		}));
		/* eslint-enable @typescript-eslint/no-explicit-any */

		return NextResponse.json({success: true, requests: transformedData}, {status: 200});
	} catch (error) {
		console.error(error);
		// Sentry.captureException(error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
