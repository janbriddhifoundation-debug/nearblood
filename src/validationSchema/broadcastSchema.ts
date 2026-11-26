import {z} from "zod";
import {BLOOD_GROUPS} from "@/data/Others";

export const broadcastAudienceSchema = z.object({
	bloodGroups: z.array(z.enum(BLOOD_GROUPS as [string, ...string[]])).default([]),
	availableOnly: z.boolean().default(true),
});

export const broadcastSchema = broadcastAudienceSchema.extend({
	title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title can't exceed 100 characters"),
	message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message can't exceed 1000 characters"),
});

export type TBroadcastAudience = z.infer<typeof broadcastAudienceSchema>;
export type TBroadcast = z.infer<typeof broadcastSchema>;
