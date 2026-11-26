import {ZodTypeAny} from "zod";

// Lets formik validate with the same zod schema the API uses: returns {field: firstMessage}
export function zodFormikValidate<T>(schema: ZodTypeAny) {
	return (values: T): Record<string, string> => {
		const result = schema.safeParse(values);
		if (result.success) return {};

		const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;

		return Object.entries(fieldErrors).reduce<Record<string, string>>((acc, [field, messages]) => {
			if (messages?.[0]) acc[field] = messages[0];
			return acc;
		}, {});
	};
}
