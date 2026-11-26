import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {NextResponse} from "next/server";

export async function GET() {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (!user || user.role !== "admin") {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		return NextResponse.json({success: true}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
