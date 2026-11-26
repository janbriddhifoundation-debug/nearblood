import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {auth} from "@/auth";
import {prisma} from "../../../../../prisma/prisma";
import {getErrorMessage} from "@/utils/getErrorMessage";

const upsertUserSchema = z.object({
	role: z.enum(["user", "donor", "ngo"], {errorMap: () => ({message: "Please select a valid role"})}),
});

// Creates the signed-in person's account with the role they picked. The email always comes from the session,
// and an existing role is never changed here ("admin" can only be set in the database).
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		const email = session?.user?.email;

		if (!email) {
			return NextResponse.json({error: "Unauthorized"}, {status: 401});
		}

		const validationResult = upsertUserSchema.safeParse(await request.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {role} = validationResult.data;
		const existingUser = await prisma.user.findUnique({where: {email}, select: {id: true, role: true}});

		if (existingUser?.role) {
			return NextResponse.json({error: "Role is already set for this account"}, {status: 409});
		}

		const userData = await prisma.user.upsert({
			where: {email},
			update: {role, name: session.user.name, image: session.user.image},
			create: {email, role, name: session.user.name, image: session.user.image},
			select: {id: true, role: true},
		});

		return NextResponse.json({success: true, user: userData}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
