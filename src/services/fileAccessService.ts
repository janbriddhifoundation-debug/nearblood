import {prisma} from "../../prisma/prisma";

// R2 folders and who may read them through /api/s3
export const PUBLIC_FILE_FOLDERS = ["ngo-events"];
export const SIGNED_IN_FILE_FOLDERS = ["donors"];
export const RESTRICTED_FILE_FOLDERS = ["donation-proof", "ngo-reg-certificate", "ngo-contact-id-proof", "support-payments"];

type TFileViewer = {id: string; role: string | null; organisationId?: string};

// Restricted files: admins, whoever uploaded the file, and the people the file is about
export async function canViewRestrictedFile(viewer: TFileViewer, folder: string, filekey: string): Promise<boolean> {
	if (viewer.role === "admin") return true;

	const uploadedByViewer = await prisma.upload.findFirst({where: {userId: viewer.id, filekey}, select: {id: true}});
	if (uploadedByViewer) return true;

	if (folder === "donation-proof") {
		// The requester who raised the request, or an NGO that assigned donors to it
		const proof = await prisma.donationProof.findFirst({
			where: {
				filekey,
				Request: {
					OR: [{userId: viewer.id}, ...(viewer.organisationId ? [{RequestDonors: {some: {organisationId: viewer.organisationId}}}] : [])],
				},
			},
			select: {id: true},
		});
		return !!proof;
	}

	if (folder === "ngo-reg-certificate") {
		const organisation = await prisma.organisation.findFirst({where: {regCertFilename: filekey, userId: viewer.id}, select: {id: true}});
		return !!organisation;
	}

	if (folder === "ngo-contact-id-proof") {
		const contact = await prisma.organisationContact.findFirst({where: {govtIdFilename: filekey, Organisation: {userId: viewer.id}}, select: {id: true}});
		return !!contact;
	}

	return false;
}
