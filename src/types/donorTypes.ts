export type TDonorStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IDonorProfile {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	gender: string | null;
	dob: string | null;
	bloodGroup: string | null;
	address: string | null;
	locationName: string | null;
	latitude: number | null;
	longitude: number | null;
	photo: string | null;
	photoUrl: string | null;
	isAvailable: boolean;
	status: TDonorStatus;
	createdAt: string | null;
}

export interface IDonorOrganisation {
	id: string;
	name: string | null;
	type: string | null;
	address: string | null;
	website: string | null;
	contact: {name: string | null; designation: string | null; phone: string | null; email: string | null} | null;
}

export interface IDonorStats {
	totalDonations: number;
	timesAssigned: number;
	lastDonatedAt: string | null;
	nextEligibleAt: string | null;
	isEligibleNow: boolean;
}

export interface IDonorMe {
	donor: IDonorProfile;
	organisation: IDonorOrganisation | null;
	stats: IDonorStats;
}

export interface IDonorDonation {
	id: string;
	assignedAt: string | null;
	organisationName: string | null;
	requestId: string | null;
	hospital: string | null;
	locationName: string | null;
	bloodGroup: string | null;
	units: number | null;
	requirementDate: string | null;
	requestStatus: string;
	certificate: {id: string; certificateNumber: string; generatedAt: string} | null;
}
