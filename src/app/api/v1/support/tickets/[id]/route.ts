import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../../prisma/prisma";
import {getAccessibleTicket, getSupportPagePath} from "@/services/supportService";
import {notifyUsers} from "@/services/notificationService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {supportStatusSchema} from "@/validationSchema/supportSchema";

type RouteParams = {params: Promise<{id: string}>};

// Ticket with its conversation
export async function GET(_req: NextRequest, {params}: RouteParams) {
	try {
		const {id} = await params;
		const access = await getAccessibleTicket(id);
		if (access.error) return access.response;

		const ticket = await prisma.supportTicket.findUnique({
			where: {id},
			select: {
				id: true,
				subject: true,
				category: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				User: {select: {name: true, email: true, role: true}},
				Organisation: {select: {id: true, name: true}},
				Messages: {
					orderBy: {createdAt: "asc"},
					select: {id: true, message: true, isStaff: true, createdAt: true, User: {select: {name: true, image: true}}},
				},
			},
		});

		return NextResponse.json({success: true, ticket}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

// Change status: admins any status; the person who raised it can only close it
export async function PATCH(req: NextRequest, {params}: RouteParams) {
	try {
		const {id} = await params;
		const access = await getAccessibleTicket(id);
		if (access.error) return access.response;

		const validationResult = supportStatusSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {status} = validationResult.data;

		if (!access.isAdmin && status !== "CLOSED") {
			return NextResponse.json({error: "You can only close your own ticket"}, {status: 403});
		}

		const ticket = await prisma.supportTicket.update({where: {id}, data: {status}, select: {id: true, status: true, subject: true, userId: true}});

		if (access.isAdmin && (status === "RESOLVED" || status === "CLOSED") && ticket.userId !== access.user.id) {
			const owner = await prisma.user.findUnique({where: {id: ticket.userId}, select: {role: true}});
			await notifyUsers([ticket.userId], {
				type: "SUPPORT_STATUS",
				title: status === "RESOLVED" ? "Your support ticket was resolved" : "Your support ticket was closed",
				message: ticket.subject,
				link: `${getSupportPagePath(owner?.role)}?ticket=${ticket.id}`,
			});
		}

		return NextResponse.json({success: true, ticket: {id: ticket.id, status: ticket.status}}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
