import {z} from "zod";

export const requestSchema = z.object({
	patientName: z.string().min(2, "Patient name is required"),
	age: z.number().min(1, "Age must be a positive number"),
	gender: z.enum(["male", "female", "other"], {
		errorMap: () => ({message: "Gender is required and must be valid"}),
	}),
	patientAddress: z.string().optional(),
	relWRequester: z.string().optional(),
	hospitalRegNo: z.string().optional(),
	bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
		errorMap: () => ({message: "Blood group is required and must be valid"}),
	}),
	units: z.number().min(1, "Units must be greater than zero"),
	urgency: z.enum(["low", "medium", "high"], {
		errorMap: () => ({message: "Urgency is required and must be valid"}),
	}),
	reason: z.string().min(1, "Reason is required"),
	hospital: z.string().min(1, "Hospital name is required"),
	locationName: z.string().min(1, "Location is required"),
	latitude: z.number({
		required_error: "Latitude is required",
	}),
	longitude: z.number({
		required_error: "Longitude is required",
	}),
	requirementDate: z.string(),
	contact: z
		.string({
			required_error: "Contact information is required",
		})
		.regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, {
			message: "Invalid Indian phone number",
		}),
	notes: z.string().optional(),
});
