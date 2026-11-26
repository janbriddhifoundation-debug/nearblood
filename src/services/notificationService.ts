import {prisma} from "../../prisma/prisma";

export type TNotificationInput = {
	type: string;
	title: string;
	message: string;
	link?: string;
};

// Notifications are a side effect: a failure is logged but never breaks the action that triggered it.
export async function notifyUsers(userIds: (string | null | undefined)[], notification: TNotificationInput) {
	const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
	if (uniqueIds.length === 0) return 0;

	try {
		const result = await prisma.notification.createMany({
			data: uniqueIds.map((userId) => ({userId, ...notification})),
		});
		return result.count;
	} catch (error) {
		console.error("Failed to create notifications:", error);
		return 0;
	}
}

// The account that registered the NGO
export async function notifyOrganisation(organisationId: string | null | undefined, notification: TNotificationInput) {
	if (!organisationId) return 0;

	const organisation = await prisma.organisation.findUnique({where: {id: organisationId}, select: {userId: true}});
	return notifyUsers([organisation?.userId], notification);
}

export async function notifyAdmins(notification: TNotificationInput) {
	const admins = await prisma.user.findMany({where: {role: "admin", status: "active"}, select: {id: true}});
	return notifyUsers(
		admins.map((admin) => admin.id),
		notification,
	);
}

// Donor records only reach people who have a NearBlood login (Donor.userId)
export async function notifyDonors(donorIds: string[], notification: TNotificationInput) {
	if (donorIds.length === 0) return 0;

	const donors = await prisma.donor.findMany({where: {id: {in: donorIds}, userId: {not: null}}, select: {userId: true}});
	return notifyUsers(
		donors.map((donor) => donor.userId),
		notification,
	);
}
