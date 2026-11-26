import {NextRequest, NextResponse} from "next/server";
import {prisma} from "../../../../../../../prisma/prisma";
import {getActiveDonor} from "@/services/donorService";
import {getErrorMessage} from "@/utils/getErrorMessage";

type RouteParams = {params: Promise<{requestDonorId: string}>};

// One of the signed-in donor's own certificates, in the shape DonationCertificateView renders
export async function GET(_req: NextRequest, {params}: RouteParams) {
	try {
		const {error, response, donor} = await getActiveDonor();
		if (error) return response;

		const {requestDonorId} = await params;

		const requestDonor = await prisma.requestDonors.findFirst({
			where: {id: requestDonorId, donorId: donor.id},
			select: {
				DonationCertificate: {select: {certificateNumber: true, generatedAt: true}},
				Organisation: {select: {name: true}},
			},
		});

		if (!requestDonor?.DonationCertificate) {
			return NextResponse.json({error: "Certificate not found"}, {status: 404});
		}

		return NextResponse.json(
			{
				success: true,
				certificate: {
					certificateNumber: requestDonor.DonationCertificate.certificateNumber,
					generatedAt: requestDonor.DonationCertificate.generatedAt,
					donorName: donor.name ?? "",
					organisationName: requestDonor.Organisation?.name ?? "",
				},
			},
			{status: 200},
		);
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
