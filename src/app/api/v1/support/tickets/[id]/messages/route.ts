import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../../../prisma/prisma";
import {getAccessibleTicket, getSupportPagePath} from "@/services/supportService";
import {notifyAdmins, notifyUsers} from "@/services/notificationService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {supportReplySchema} from "@/validationSchema/supportSchema";

type RouteParams = {params: Promise<{id: string}>};

// Reply on a ticket. Staff replies move it to IN_PROGRESS; the owner replying re-opens a resolved ticket.
export async function POST(req: NextRequest, {params}: RouteParams) {
	try {
		const {id} = await params;
		const access = await getAccessibleTicket(id);
		if (access.error) return access.response;

		const validationResult = supportReplySchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		if (access.ticket.status === "CLOSED") {
			return NextResponse.json({error: "This ticket is closed. Please raise a new one."}, {status: 400});
		}

		const isStaffReply = access.isAdmin && access.ticket.userId !== access.user.id;
		const nextStatus = isStaffReply ? (access.ticket.status === "OPEN" ? "IN_PROGRESS" : access.ticket.status) : access.ticket.status === "RESOLVED" ? "OPEN" : access.ticket.status;

		const [message] = await prisma.$transaction([
			prisma.supportTicketMessage.create({
				data: {ticketId: id, userId: access.user.id, message: validationResult.data.message, isStaff: isStaffReply},
				select: {id: true, message: true, isStaff: true, createdAt: true},
			}),
			prisma.supportTicket.update({where: {id}, data: {status: nextStatus, updatedAt: new Date()}}),
		]);

		if (isStaffReply) {
			const owner = await prisma.user.findUnique({where: {id: access.ticket.userId}, select: {role: true}});
			await notifyUsers([access.ticket.userId], {
				type: "SUPPORT_REPLY",
				title: "NearBlood support replied",
				message: access.ticket.subject,
				link: `${getSupportPagePath(owner?.role)}?ticket=${id}`,
			});
		} else {
			await notifyAdmins({
				type: "SUPPORT_REPLY",
				title: "New reply on a support ticket",
				message: access.ticket.subject,
				link: `/admin/support-grievance?ticket=${id}`,
			});
		}

		return NextResponse.json({success: true, message, status: nextStatus}, {status: 201});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
