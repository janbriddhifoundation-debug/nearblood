import {NextResponse} from "next/server";
import {Prisma} from "@prisma/client";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveDonor} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {NEARBY_NGO_RADIUS_KM} from "@/data/Donor";

type TCampRow = {
	id: string;
	eventName: string;
	purpose: string | null;
	eventDate: Date;
	venueName: string | null;
	imageFilekey: string | null;
	donorsRequired: number | null;
	registeredDonors: number;
	status: string;
	organisationName: string | null;
	isMyNgo: boolean;
	distanceKm: number | null;
};

// Upcoming camps the donor can join (their NGO's, plus any approved NGO's camp within 25 km) and their camp history
export async function GET() {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const hasLocation = donor.latitude !== null && donor.longitude !== null;
		const point = hasLocation ? Prisma.sql`ST_SetSRID(ST_MakePoint(${donor.longitude}, ${donor.latitude}), 4326)::geography` : null;
		const distance = point ? Prisma.sql`ST_Distance(e.location, ${point}) / 1000` : Prisma.sql`NULL::float`;
		const nearby = point ? Prisma.sql`OR ST_DWithin(e.location, ${point}, ${NEARBY_NGO_RADIUS_KM * 1000})` : Prisma.empty;

		const camps = await prisma.$queryRaw<TCampRow[]>`
			SELECT
				e.id, e."eventName", e.purpose, e."eventDate", e."venueName", e."imageFilekey", e."donorsRequired", e."registeredDonors", e.status::text AS status,
				o.name AS "organisationName",
				(e."organisationId" = ${donor.organisationId ?? ""}) AS "isMyNgo",
				${distance} AS "distanceKm"
			FROM "NgoEvent" e
			JOIN "Organisation" o ON o.id = e."organisationId"
			WHERE o."approvedAt" IS NOT NULL
				AND e.status IN ('ACTIVE', 'ONGOING')
				AND e."eventDate" >= CURRENT_DATE
				AND (e."organisationId" = ${donor.organisationId ?? ""} ${nearby})
			ORDER BY e."eventDate" ASC
			LIMIT 50
		`;

		const [myUpcoming, history] = await Promise.all([
			prisma.eventRegistration.findMany({
				where: {donorId: donor.id, eventId: {in: camps.map((camp) => camp.id)}},
				select: {eventId: true, status: true},
			}),
			prisma.eventRegistration.findMany({
				where: {donorId: donor.id, status: {not: "CANCELLED"}, Event: {eventDate: {lt: new Date(new Date().toDateString())}}},
				orderBy: {Event: {eventDate: "desc"}},
				take: 20,
				select: {id: true, status: true, unitsDonated: true, Event: {select: {eventName: true, eventDate: true, venueName: true, Organisation: {select: {name: true}}}}},
			}),
		]);

		const registrationByEvent = Object.fromEntries(myUpcoming.map((registration) => [registration.eventId, registration.status]));

		const data = camps.map((camp) => ({
			...camp,
			distanceKm: camp.distanceKm === null ? null : Math.round(Number(camp.distanceKm) * 10) / 10,
			imageUrl: camp.imageFilekey ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/ngo-events/${camp.imageFilekey}` : null,
			myRegistration: registrationByEvent[camp.id] ?? null,
		}));

		return NextResponse.json(
			{
				success: true,
				data,
				history: history.map((item) => ({
					id: item.id,
					status: item.status,
					unitsDonated: item.unitsDonated,
					eventName: item.Event.eventName,
					eventDate: item.Event.eventDate,
					venueName: item.Event.venueName,
					organisationName: item.Event.Organisation.name,
				})),
			},
			{status: 200},
		);
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
