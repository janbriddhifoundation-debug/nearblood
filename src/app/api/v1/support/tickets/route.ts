import {NextRequest, NextResponse} from "next/server";
import {Prisma, SupportTicketStatus} from "@prisma/client";
import {prisma} from "../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {notifyAdmins} from "@/services/notificationService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {supportTicketSchema} from "@/validationSchema/supportSchema";

// Own tickets for everyone; admins get all tickets, filterable by status and search
export async function GET(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		const isAdmin = user.role === "admin";
		const searchParams = req.nextUrl.searchParams;
		const status = searchParams.get("status");
		const search = searchParams.get("search")?.trim();

		const where: Prisma.SupportTicketWhereInput = isAdmin ? {} : {userId: user.id};

		if (status && Object.values(SupportTicketStatus).includes(status as SupportTicketStatus)) {
			where.status = status as SupportTicketStatus;
		}

		if (search) {
			where.OR = [
				{subject: {contains: search, mode: "insensitive"}},
				{User: {name: {contains: search, mode: "insensitive"}}},
				{User: {email: {contains: search, mode: "insensitive"}}},
				{Organisation: {name: {contains: search, mode: "insensitive"}}},
			];
		}

		const [tickets, statusCounts] = await Promise.all([
			prisma.supportTicket.findMany({
				where,
				orderBy: {updatedAt: "desc"},
				take: 100,
				select: {
					id: true,
					subject: true,
					category: true,
					status: true,
					createdAt: true,
					updatedAt: true,
					User: {select: {name: true, email: true, role: true}},
					Organisation: {select: {name: true}},
					_count: {select: {Messages: true}},
				},
			}),
			prisma.supportTicket.groupBy({by: ["status"], where: isAdmin ? {} : {userId: user.id}, _count: {_all: true}}),
		]);

		const data = tickets.map(({User, Organisation, _count, ...ticket}) => ({
			...ticket,
			raisedBy: isAdmin ? {name: User.name, email: User.email, role: User.role, organisationName: Organisation?.name ?? null} : null,
			messageCount: _count.Messages,
		}));

		return NextResponse.json({success: true, data, counts: Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all]))}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

// Raise a ticket (any signed-in user)
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		const validationResult = supportTicketSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {subject, category, message} = validationResult.data;

		// Pending NGOs have no organisationId on the user, so look it up directly (they may need help with verification)
		const organisation = user.role === "ngo" ? await prisma.organisation.findFirst({where: {userId: user.id}, select: {id: true}}) : null;

		const ticket = await prisma.supportTicket.create({
			data: {
				userId: user.id,
				organisationId: organisation?.id ?? null,
				subject,
				category,
				Messages: {create: {userId: user.id, message, isStaff: false}},
			},
			select: {id: true},
		});

		await notifyAdmins({
			type: "SUPPORT_TICKET",
			title: "New support ticket",
			message: `${user.name ?? user.email}: ${subject}`,
			link: `/admin/support-grievance?ticket=${ticket.id}`,
		});

		return NextResponse.json({success: true, ticket}, {status: 201});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
