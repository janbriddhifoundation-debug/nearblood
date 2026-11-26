import {NextRequest, NextResponse} from "next/server";
import {Prisma} from "@prisma/client";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {isPersonalRole} from "@/utils/roleRoutes";
import {NEARBY_NGO_RADIUS_KM} from "@/data/Donor";

type TNearbyNgoRow = {
	id: string;
	name: string | null;
	type: string | null;
	address: string | null;
	regions: string | null;
	distanceKm: number | null;
};

// Approved NGOs for the donor sign-up picker.
// Without `search`: NGOs covering a region within 25 km of the donor OR a region in the donor's city, nearest first.
// With `search`: any approved NGO matching the name (distance shown when lat/lon are given).
export async function GET(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!isPersonalRole(user.role)) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const searchParams = req.nextUrl.searchParams;
		const search = searchParams.get("search")?.trim();
		const latitude = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
		const longitude = searchParams.get("lon") ? Number(searchParams.get("lon")) : null;
		const city = searchParams.get("city")?.trim();
		const area = searchParams.get("area")?.trim();
		const hasPoint = latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude);

		if (!search && !hasPoint && !city && !area) {
			return NextResponse.json({error: "Select your location or search an NGO by name"}, {status: 400});
		}

		const point = hasPoint ? Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography` : null;
		const distance = point ? Prisma.sql`MIN(ST_Distance(r.location, ${point})) / 1000` : Prisma.sql`NULL::float`;

		const areaConditions: Prisma.Sql[] = [];
		if (point) areaConditions.push(Prisma.sql`ST_DWithin(r.location, ${point}, ${NEARBY_NGO_RADIUS_KM * 1000})`);
		// NGO region names its city (e.g. "Guwahati, Assam, India")
		if (city) areaConditions.push(Prisma.sql`r."locationName" ILIKE ${`%${city}%`}`);
		// NGO covers a bigger area the donor is inside (e.g. region "Assam, India" for a donor in "Dispur, Guwahati, Assam")
		if (area) areaConditions.push(Prisma.sql`length(split_part(r."locationName", ',', 1)) > 2 AND ${area} ILIKE '%' || trim(split_part(r."locationName", ',', 1)) || '%'`);

		const filter = search ? Prisma.sql`o.name ILIKE ${`%${search}%`}` : Prisma.sql`(${Prisma.join(areaConditions, " OR ")})`;

		const ngos = await prisma.$queryRaw<TNearbyNgoRow[]>`
			SELECT
				o.id,
				o.name,
				o.type,
				o.address,
				string_agg(DISTINCT r."locationName", ' | ') AS regions,
				${distance} AS "distanceKm"
			FROM "Organisation" o
			LEFT JOIN "OrganisationRegion" r ON r."organisationId" = o.id
			WHERE o."approvedAt" IS NOT NULL AND ${filter}
			GROUP BY o.id
			ORDER BY "distanceKm" ASC NULLS LAST, o.name ASC
			LIMIT 50
		`;

		const data = ngos.map((ngo) => ({
			...ngo,
			distanceKm: ngo.distanceKm === null ? null : Math.round(Number(ngo.distanceKm) * 10) / 10,
		}));

		return NextResponse.json({success: true, data, radiusKm: NEARBY_NGO_RADIUS_KM, city: city ?? null}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
