import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {notifyDonors} from "@/services/notificationService";
import {CAMP_TRANSACTION_OPTIONS, syncEventCounts} from "@/services/eventService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {registrationUpdateSchema} from "@/validationSchema/campSchema";

type RouteParams = {params: Promise<{id: string; registrationId: string}>};

// NGO records whether a registered donor came and how many units they gave
export async function PATCH(req: NextRequest, {params}: RouteParams) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const validationResult = registrationUpdateSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {id, registrationId} = await params;
		const registration = await prisma.eventRegistration.findFirst({
			where: {id: registrationId, eventId: id, Event: {organisationId: user.organisationId}},
			select: {id: true, status: true, donorId: true, Event: {select: {eventName: true, eventDate: true}}, Donor: {select: {lastDonatedAt: true}}},
		});

		if (!registration) {
			return NextResponse.json({error: "Registration not found"}, {status: 404});
		}

		if (registration.status === "CANCELLED") {
			return NextResponse.json({error: "The donor cancelled this registration"}, {status: 400});
		}

		const {status, unitsDonated} = validationResult.data;
		const isAttended = status === "ATTENDED";
		const eventDate = registration.Event.eventDate;

		await prisma.$transaction(async (tx) => {
			await tx.eventRegistration.update({
				where: {id: registration.id},
				data: {status, unitsDonated: isAttended ? unitsDonated : null},
			});

			// A camp donation counts for the donor's eligibility like any other
			if (isAttended && eventDate <= new Date() && (!registration.Donor.lastDonatedAt || registration.Donor.lastDonatedAt < eventDate)) {
				await tx.donor.update({where: {id: registration.donorId}, data: {lastDonatedAt: eventDate}});
			}

			await syncEventCounts(id, tx);
		}, CAMP_TRANSACTION_OPTIONS);

		if (isAttended && registration.status !== "ATTENDED") {
			await notifyDonors([registration.donorId], {
				type: "CAMP_ATTENDED",
				title: "Thank you for donating!",
				message: `Your donation at ${registration.Event.eventName} has been recorded.`,
				link: "/donor/camps",
			});
		}

		return NextResponse.json({success: true}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
