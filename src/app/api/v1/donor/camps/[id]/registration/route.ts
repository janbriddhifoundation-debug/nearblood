import {NextRequest, NextResponse} from "next/server";
import dayjs from "dayjs";
import {prisma} from "../../../../../../../../prisma/prisma";
import {getActiveDonor} from "@/services/donorService";
import {notifyOrganisation} from "@/services/notificationService";
import {CAMP_TRANSACTION_OPTIONS, syncEventCounts} from "@/services/eventService";
import {getErrorMessage} from "@/utils/getErrorMessage";

type RouteParams = {params: Promise<{id: string}>};

// A camp the donor can still join: approved NGO, open, not in the past
async function findOpenCamp(eventId: string) {
	return prisma.ngoEvent.findFirst({
		where: {
			id: eventId,
			status: {in: ["ACTIVE", "ONGOING"]},
			eventDate: {gte: dayjs().startOf("day").toDate()},
			Organisation: {approvedAt: {not: null}},
		},
		select: {id: true, eventName: true, eventDate: true, organisationId: true},
	});
}

// Register for a camp (or re-register after cancelling)
export async function POST(_req: NextRequest, {params}: RouteParams) {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const {id} = await params;
		const camp = await findOpenCamp(id);

		if (!camp) {
			return NextResponse.json({error: "This camp is no longer open for registration"}, {status: 404});
		}

		const existing = await prisma.eventRegistration.findUnique({where: {eventId_donorId: {eventId: id, donorId: donor.id}}, select: {id: true, status: true}});

		if (existing && existing.status !== "CANCELLED") {
			return NextResponse.json({error: "You are already registered for this camp"}, {status: 409});
		}

		await prisma.$transaction(async (tx) => {
			if (existing) {
				await tx.eventRegistration.update({where: {id: existing.id}, data: {status: "REGISTERED", unitsDonated: null}});
			} else {
				await tx.eventRegistration.create({data: {eventId: id, donorId: donor.id}});
			}
			await syncEventCounts(id, tx);
		}, CAMP_TRANSACTION_OPTIONS);

		await notifyOrganisation(camp.organisationId, {
			type: "CAMP_REGISTRATION",
			title: "New camp registration",
			message: `${donor.name} (${donor.bloodGroup}) registered for ${camp.eventName} on ${dayjs(camp.eventDate).format("DD MMM YYYY")}.`,
			link: `/ngo/blood-donation-events/${camp.id}`,
		});

		return NextResponse.json({success: true, status: "REGISTERED"}, {status: 201});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

// Cancel a registration before the camp
export async function DELETE(_req: NextRequest, {params}: RouteParams) {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const {id} = await params;
		const camp = await findOpenCamp(id);
		const registration = await prisma.eventRegistration.findUnique({where: {eventId_donorId: {eventId: id, donorId: donor.id}}, select: {id: true, status: true}});

		if (!camp || !registration || registration.status !== "REGISTERED") {
			return NextResponse.json({error: "There is no registration you can cancel for this camp"}, {status: 400});
		}

		await prisma.$transaction(async (tx) => {
			await tx.eventRegistration.update({where: {id: registration.id}, data: {status: "CANCELLED"}});
			await syncEventCounts(id, tx);
		}, CAMP_TRANSACTION_OPTIONS);

		return NextResponse.json({success: true, status: "CANCELLED"}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
