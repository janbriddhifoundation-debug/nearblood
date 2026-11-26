export interface IRequestActivity {
	activity: string;
	createdAt: string;
}

export interface IDonationProof {
	url: string;
}

export interface IDonor {
	id: string;
	name: string;
	gender: string;
	email: string;
	phone: string;
	bloodGroup: string;
	address: string;
	photo?: string;
}

export interface IOrganisation {
	id: string;
	name: string;
	type: string;
	address: string;
}

export interface IRequestDonor {
	id: string;
	requestId: string;
	donorId: string;
	organisationId: string;
	createdAt: string;
	updatedAt: string;
	Donor: IDonor;
	Organisation: IOrganisation;
}

export interface IBloodRequest {
	id: string;
	patientName: string;
	age: number;
	gender: "male" | "female" | "other";
	patientAddress: string;
	relWRequester: string;
	hospitalRegNo: string;
	bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
	urgency: "low" | "medium" | "high";
	reason: string;
	hospital: string;
	locationName: string;
	requirementDate: string;
	contact: string;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	userId: string;
	latitude: number;
	longitude: number;
	units: number;
	feedback: string | null;
	RequestActivity: IRequestActivity[];
	DonationProof: IDonationProof[];
	RequestDonors?: IRequestDonor[];
	status?: string;
}
