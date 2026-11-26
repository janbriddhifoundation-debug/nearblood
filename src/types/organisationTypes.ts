export interface IOrganisation {
	key: string;
	name: string;
	email: string;
	type: string;
	address: string;
	registeredAt: string;
	status: "APPROVED" | "PENDING";
	approvedAt?: string | null;
	description?: string;
}
