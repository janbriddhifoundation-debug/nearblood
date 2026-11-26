import {z} from "zod";

export const eventStatusSchema = z.object({
	status: z.enum(["ACTIVE", "ONGOING", "CLOSED"], {errorMap: () => ({message: "Invalid event status"})}),
});

// NGO marks a camp registration after the camp
export const registrationUpdateSchema = z
	.object({
		status: z.enum(["REGISTERED", "ATTENDED", "NO_SHOW"], {errorMap: () => ({message: "Invalid registration status"})}),
		unitsDonated: z.number().int().min(1, "Units must be at least 1").max(2, "A donor gives at most 2 units").nullable().optional(),
	})
	.refine((value) => value.status !== "ATTENDED" || !!value.unitsDonated, {message: "Enter the units donated", path: ["unitsDonated"]});
