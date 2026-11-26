import {z} from "zod";
import dayjs from "dayjs";
import {BLOOD_GROUPS} from "@/data/Others";

export const DONOR_MIN_AGE = 18;
export const DONOR_MAX_AGE = 65;

const indianPhone = z.string().regex(/^[6-9]\d{9}$/, {message: "Phone must be a valid 10-digit Indian number"});

const location = {
	locationName: z.string().min(1, "Location is required"),
	latitude: z.number({required_error: "Location is required"}),
	longitude: z.number({required_error: "Location is required"}),
};

// Donor self sign-up (name and email come from the Google account)
export const donorSelfRegistrationSchema = z.object({
	name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name can't exceed 100 characters"),
	gender: z.enum(["male", "female", "other"], {errorMap: () => ({message: "Gender is required"})}),
	phone: indianPhone,
	dob: z.string().refine(
		(value) => {
			const age = dayjs().diff(dayjs(value), "year");
			return dayjs(value).isValid() && age >= DONOR_MIN_AGE && age <= DONOR_MAX_AGE;
		},
		{message: `Donors must be between ${DONOR_MIN_AGE} and ${DONOR_MAX_AGE} years old`},
	),
	bloodGroup: z.enum(BLOOD_GROUPS as [string, ...string[]], {errorMap: () => ({message: "Blood group is required"})}),
	address: z.string().trim().min(10, "Address must be at least 10 characters"),
	photo: z.string().optional(),
	organisationId: z.string().min(1, "Please select an NGO"),
	...location,
});

// What a donor can change themselves. Blood group and DOB changes go through their NGO.
export const donorProfileUpdateSchema = z.object({
	phone: indianPhone,
	address: z.string().trim().min(10, "Address must be at least 10 characters"),
	photo: z.string().optional().nullable(),
	isAvailable: z.boolean(),
	...location,
});

export type TDonorSelfRegistration = z.infer<typeof donorSelfRegistrationSchema>;
export type TDonorProfileUpdate = z.infer<typeof donorProfileUpdateSchema>;
