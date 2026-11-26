import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";

// Latest notifications for the bell, plus the unread count
export async function GET() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		const [data, unreadCount] = await Promise.all([
			prisma.notification.findMany({
				where: {userId: user.id},
				orderBy: {createdAt: "desc"},
				take: 20,
				select: {id: true, type: true, title: true, message: true, link: true, readAt: true, createdAt: true},
			}),
			prisma.notification.count({where: {userId: user.id, readAt: null}}),
		]);

		return NextResponse.json({success: true, data, unreadCount}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}

const markReadSchema = z.object({
	ids: z.array(z.string()).optional(),
});

// Mark some (ids) or all of the user's notifications as read
export async function PATCH(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		const validationResult = markReadSchema.safeParse(await req.json().catch(() => ({})));

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {ids} = validationResult.data;

		const result = await prisma.notification.updateMany({
			where: {userId: user.id, readAt: null, ...(ids?.length ? {id: {in: ids}} : {})},
			data: {readAt: new Date()},
		});

		return NextResponse.json({success: true, updated: result.count}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
