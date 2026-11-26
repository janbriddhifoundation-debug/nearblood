import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "../../../../../../../../prisma/prisma";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {notifyDonors} from "@/services/notificationService";

const donorStatusSchema = z.object({
	status: z.enum(["APPROVED", "REJECTED"], {errorMap: () => ({message: "Status must be APPROVED or REJECTED"})}),
});

type RouteParams = {params: Promise<{id: string}>};

// NGO approves or rejects a donor who signed up under them
export async function PATCH(req: NextRequest, {params}: RouteParams) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		if (user.role !== "ngo" || !user.organisationId || !user.isApprovedNgo) {
			return NextResponse.json({error: "Unauthorized request"}, {status: 403});
		}

		const validationResult = donorStatusSchema.safeParse(await req.json());

		if (!validationResult.success) {
			const flattened = validationResult.error.flatten();
			return NextResponse.json({success: false, errors: flattened.fieldErrors, formErrors: flattened.formErrors}, {status: 400});
		}

		const {id} = await params;
		const donor = await prisma.donor.findFirst({where: {id, organisationId: user.organisationId}, select: {id: true}});

		if (!donor) {
			return NextResponse.json({error: "Donor not found"}, {status: 404});
		}

		const updatedDonor = await prisma.donor.update({
			where: {id: donor.id},
			data: {status: validationResult.data.status},
			select: {id: true, status: true},
		});

		const isApproved = updatedDonor.status === "APPROVED";
		await notifyDonors([updatedDonor.id], {
			type: isApproved ? "DONOR_APPROVED" : "DONOR_REJECTED",
			title: isApproved ? "You're now an active donor" : "Donor application not approved",
			message: isApproved ? "Your NGO approved you. They will contact you when your blood group is needed." : "Your NGO couldn't approve your application. You can apply through another NGO.",
			link: isApproved ? "/donor/dashboard" : "/donor/awaiting-approval",
		});

		return NextResponse.json({success: true, donor: updatedDonor}, {status: 200});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
