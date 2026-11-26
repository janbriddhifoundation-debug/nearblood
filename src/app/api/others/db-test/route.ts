import {NextResponse} from "next/server";
import {requireRole} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {prisma} from "../../../../../prisma/prisma";

// Admin-only database health check
export async function GET() {
	try {
		const {error, response} = await requireRole(["admin"]);
		if (error) return response;

		await prisma.$queryRaw`SELECT 1`;

		return NextResponse.json({success: true, message: "Database connection OK"}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({success: false, error: errorMessage}, {status: 500});
	}
}
