import {Prisma} from "@prisma/client";
import {prisma} from "../../prisma/prisma";

type TPrismaClient = Prisma.TransactionClient | typeof prisma;

// Registration changes run ~5 queries in one transaction; the hosted DB is ~400 ms per round trip,
// so Prisma's 5 s default is too tight.
export const CAMP_TRANSACTION_OPTIONS = {timeout: 15000, maxWait: 10000};

// NgoEvent keeps registeredDonors / actualDonors / unitsCollected as plain numbers for lists and the dashboard.
// Recompute them from EventRegistration after any registration change.
export async function syncEventCounts(eventId: string, client: TPrismaClient = prisma) {
	const [registered, attended] = await Promise.all([
		client.eventRegistration.count({where: {eventId, status: {not: "CANCELLED"}}}),
		client.eventRegistration.aggregate({where: {eventId, status: "ATTENDED"}, _count: {_all: true}, _sum: {unitsDonated: true}}),
	]);

	await client.ngoEvent.update({
		where: {id: eventId},
		data: {
			registeredDonors: registered,
			actualDonors: attended._count._all,
			unitsCollected: attended._sum.unitsDonated ?? 0,
		},
	});
}
