import {NextResponse} from "next/server";
import {prisma} from "../../prisma/prisma";
import {getActiveUser} from "@/services/userService";

// Loads a ticket the signed-in user may see: their own, or any ticket for admins
export async function getAccessibleTicket(ticketId: string) {
	const {error, response, user} = await getActiveUser();
	if (error) return {error: true as const, response, user: null, ticket: null};

	const isAdmin = user.role === "admin";
	const ticket = await prisma.supportTicket.findFirst({
		where: {id: ticketId, ...(isAdmin ? {} : {userId: user.id})},
	});

	if (!ticket) {
		return {error: true as const, response: NextResponse.json({error: "Ticket not found"}, {status: 404}), user: null, ticket: null};
	}

	return {error: false as const, response: undefined, user, ticket, isAdmin};
}

// Where the ticket owner reads their tickets, by role
export function getSupportPagePath(role?: string | null) {
	switch (role) {
		case "admin":
			return "/admin/support-grievance";
		case "ngo":
			return "/ngo/support-helpdesk";
		case "donor":
			return "/donor/support";
		default:
			return "/user/support";
	}
}
