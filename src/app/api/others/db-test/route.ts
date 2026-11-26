import {NextResponse} from "next/server";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {prisma} from "../../../../../prisma/prisma";

export async function GET() {
	try {
		await prisma.$queryRaw`SELECT 1`;

		return NextResponse.json({success: true, message: "Database connection OK"}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({success: false, error: errorMessage}, {status: 500});
	}
}
