import {NextRequest, NextResponse} from "next/server";
import {Prisma} from "@prisma/client";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {notifyUsers} from "@/services/notificationService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {broadcastAudienceSchema, broadcastSchema, TBroadcastAudience} from "@/validationSchema/broadcastSchema";

function getAudienceWhere(organisationId: string, {bloodGroups, availableOnly}: TBroadcastAudience): Prisma.DonorWhereInput {
	return {
		organisationId,
		status: "APPROVED",
		...(bloodGroups.length ? {bloodGroup: {in: bloodGroups}} : {}),
		...(availableOnly ? {isAvailable: true} : {}),
	};
}

// GET: past broadcasts. With ?audience=1&bloodGroups=A+,B+&availableOnly=true: how many donors a message would reach.
export async function GET(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const searchParams = req.nextUrl.searchParams;

		if (searchParams.get("audience")) {
			const audience = broadcastAudienceSchema.parse({
				bloodGroups: searchParams.get("bloodGroups")?.split(",").filter(Boolean) ?? [],
				availableOnly: searchParams.get("availableOnly") !== "false",
			});
			const where = getAudienceWhere(user.organisationId, audience);
			const [matched, reachable] = await Promise.all([prisma.donor.count({where}), prisma.donor.count({where: {...where, userId: {not: null}}})]);
			return NextResponse.json({success: true, matched, reachable}, {status: 200});
		}

		const broadcasts = await prisma.ngoBroadcast.findMany({
			where: {organisationId: user.organisationId},
			orderBy: {createdAt: "desc"},
			take: 50,
		});

		return NextResponse.json({success: true, data: broadcasts}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

// Send a message to the NGO's approved donors (in-app notification for donors who have a login)
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user.organisationId) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const validationResult = broadcastSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {title, message, bloodGroups, availableOnly} = validationResult.data;

		const recipients = await prisma.donor.findMany({
			where: {...getAudienceWhere(user.organisationId, {bloodGroups, availableOnly}), userId: {not: null}},
			select: {userId: true},
		});

		if (recipients.length === 0) {
			return NextResponse.json({error: "None of the selected donors have a NearBlood login yet, so nobody would receive this message."}, {status: 400});
		}

		const organisation = await prisma.organisation.findUnique({where: {id: user.organisationId}, select: {name: true}});

		const recipientCount = await notifyUsers(
			recipients.map((recipient) => recipient.userId),
			{type: "NGO_BROADCAST", title: `${organisation?.name ?? "Your NGO"}: ${title}`, message, link: "/donor/dashboard"},
		);

		const broadcast = await prisma.ngoBroadcast.create({
			data: {organisationId: user.organisationId, title, message, bloodGroups, availableOnly, recipientCount},
		});

		return NextResponse.json({success: true, broadcast}, {status: 201});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
