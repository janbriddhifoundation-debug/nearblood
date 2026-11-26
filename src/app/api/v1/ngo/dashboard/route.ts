import {NextResponse} from "next/server";
import dayjs from "dayjs";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";

// Same radius the NGO "Blood requests" page uses around each covered region
const REQUEST_RADIUS_METERS = 10000;

type TNearbyRequestRow = {
	id: string;
	bloodGroup: string | null;
	units: number | null;
	urgency: string | null;
	hospital: string | null;
	requirementDate: Date | null;
	lastActivity: string | null;
};

// NGO dashboard: headline numbers plus short lists of what needs attention
export async function GET() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const organisationId = user.organisationId;
		const startOfMonth = dayjs().startOf("month").toDate();
		const today = dayjs().startOf("day").toDate();

		const [nearbyRequests, nearbyOpenCount, donorStatusCounts, availableDonors, bloodGroupCounts, pendingDonors, upcomingEvents, upcomingEventsCount, donationsThisMonth, totalCertificates] = await Promise.all([
			prisma.$queryRaw<TNearbyRequestRow[]>`
				SELECT r.id, r."bloodGroup", r.units, r.urgency, r.hospital, r."requirementDate", ra.activity AS "lastActivity"
				FROM "Request" r
				LEFT JOIN LATERAL (
					SELECT activity FROM "RequestActivity" WHERE "requestId" = r.id ORDER BY "createdAt" DESC LIMIT 1
				) ra ON true
				WHERE EXISTS (
					SELECT 1 FROM "OrganisationRegion" g
					WHERE g."organisationId" = ${organisationId} AND ST_DWithin(r.location, g.location, ${REQUEST_RADIUS_METERS})
				)
				AND ra.activity IS DISTINCT FROM 'REQUEST_CLOSED'
				ORDER BY r."createdAt" DESC
				LIMIT 5
			`,
			prisma.$queryRaw<{count: bigint}[]>`
				SELECT COUNT(*) AS count
				FROM "Request" r
				LEFT JOIN LATERAL (
					SELECT activity FROM "RequestActivity" WHERE "requestId" = r.id ORDER BY "createdAt" DESC LIMIT 1
				) ra ON true
				WHERE EXISTS (
					SELECT 1 FROM "OrganisationRegion" g
					WHERE g."organisationId" = ${organisationId} AND ST_DWithin(r.location, g.location, ${REQUEST_RADIUS_METERS})
				)
				AND ra.activity IS DISTINCT FROM 'REQUEST_CLOSED'
			`,
			prisma.donor.groupBy({by: ["status"], where: {organisationId}, _count: {_all: true}}),
			prisma.donor.count({where: {organisationId, status: "APPROVED", isAvailable: true}}),
			prisma.donor.groupBy({by: ["bloodGroup"], where: {organisationId, status: "APPROVED"}, _count: {_all: true}}),
			prisma.donor.findMany({
				where: {organisationId, status: "PENDING"},
				orderBy: {createdAt: "asc"},
				take: 5,
				select: {id: true, name: true, bloodGroup: true, locationName: true, createdAt: true},
			}),
			prisma.ngoEvent.findMany({
				where: {organisationId, eventDate: {gte: today}, status: {not: "CLOSED"}},
				orderBy: {eventDate: "asc"},
				take: 5,
				select: {id: true, eventName: true, eventDate: true, venueName: true, donorsRequired: true, registeredDonors: true},
			}),
			prisma.ngoEvent.count({where: {organisationId, eventDate: {gte: today}, status: {not: "CLOSED"}}}),
			prisma.donationCertificate.count({where: {generatedAt: {gte: startOfMonth}, RequestDonor: {organisationId}}}),
			prisma.donationCertificate.count({where: {RequestDonor: {organisationId}}}),
		]);

		const donorsByStatus = Object.fromEntries(donorStatusCounts.map((row) => [row.status, row._count._all]));

		return NextResponse.json(
			{
				success: true,
				stats: {
					nearbyOpenRequests: Number(nearbyOpenCount[0]?.count ?? 0),
					activeDonors: donorsByStatus.APPROVED ?? 0,
					availableDonors,
					pendingDonors: donorsByStatus.PENDING ?? 0,
					upcomingEvents: upcomingEventsCount,
					donationsThisMonth,
					totalCertificates,
				},
				donorsByBloodGroup: Object.fromEntries(bloodGroupCounts.map((row) => [row.bloodGroup ?? "Unknown", row._count._all])),
				nearbyRequests,
				pendingDonors,
				upcomingEvents,
			},
			{status: 200},
		);
	} catch (error) {
		console.error("Error in NGO dashboard GET:", error);
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
