import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../../../../prisma/prisma";
import {getActiveDonor} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";

const availabilitySchema = z.object({isAvailable: z.boolean()});

// Donor pauses or resumes being contacted for donations
export async function PATCH(req: NextRequest) {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const validationResult = availabilitySchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		await prisma.donor.update({where: {id: donor.id}, data: {isAvailable: validationResult.data.isAvailable}});

		return NextResponse.json({success: true, isAvailable: validationResult.data.isAvailable}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
