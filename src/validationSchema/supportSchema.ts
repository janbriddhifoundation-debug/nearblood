import {z} from "zod";

export const SUPPORT_CATEGORIES = ["Account & access", "NGO verification", "Blood requests", "Donors", "Certificates", "Camps & events", "Bug or technical problem", "Other"];

export const supportTicketSchema = z.object({
	subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(150, "Subject can't exceed 150 characters"),
	category: z.enum(SUPPORT_CATEGORIES as [string, ...string[]], {errorMap: () => ({message: "Please choose a category"})}),
	message: z.string().trim().min(10, "Please describe the problem in at least 10 characters").max(3000, "Message can't exceed 3000 characters"),
});

export const supportReplySchema = z.object({
	message: z.string().trim().min(1, "Message can't be empty").max(3000, "Message can't exceed 3000 characters"),
});

export const supportStatusSchema = z.object({
	status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], {errorMap: () => ({message: "Invalid status"})}),
});

export type TSupportTicket = z.infer<typeof supportTicketSchema>;
