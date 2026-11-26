import axios from "axios";
import {message as antdMessage} from "antd";

type ShowOptions = {
	join?: boolean; // join messages into one toast instead of multiple
	maxToasts?: number; // maximum individual toasts to show before summarizing
};

export function showValidationErrors(error: unknown, opts: ShowOptions = {}) {
	const {join = false, maxToasts = 6} = opts;

	// Helper to show either joined or multiple toasts
	const showMessages = (messages: string[]) => {
		if (!messages || messages.length === 0) return;
		if (join) {
			antdMessage.error(messages.join(" • "));
			return;
		}

		const toShow = messages.slice(0, maxToasts);
		toShow.forEach((m) => antdMessage.error(m));
		if (messages.length > maxToasts) {
			antdMessage.error(`And ${messages.length - maxToasts} more errors`);
		}
	};

	// Axios error with structured response
	if (axios.isAxiosError(error)) {
		const respData: unknown = (error.response as unknown as {data?: unknown})?.data;

		if (!respData) {
			// If the server didn't include a body, show status/text if available
			const statusText = (error.response as unknown as {statusText?: string})?.statusText;
			if (statusText) {
				antdMessage.error(statusText);
				return;
			}
			antdMessage.error(error.message || "Something went wrong");
			return;
		}

		// Narrow to a plain object so we can inspect expected keys safely
		const dataObj = respData as Record<string, unknown>;

		// Zod-flattened shape: { errors: { fieldName: [..] }, formErrors: [...] }
		const errorsVal = dataObj["errors"];
		if (errorsVal && typeof errorsVal === "object") {
			const errorsObj = errorsVal as Record<string, unknown>;
			const all = Object.values(errorsObj).reduce<string[]>((acc, v) => {
				if (Array.isArray(v)) {
					acc.push(...v.map((x) => String(x)));
				} else if (v != null) {
					acc.push(String(v));
				}
				return acc;
			}, []);
			if (all.length) {
				showMessages(all);
				return;
			}
		}

		const formErrorsVal = dataObj["formErrors"];
		if (Array.isArray(formErrorsVal) && formErrorsVal.length) {
			showMessages(formErrorsVal.map(String));
			return;
		}

		// Generic payloads
		const errorVal = dataObj["error"];
		if (errorVal) {
			if (Array.isArray(errorVal)) {
				const msgs = (errorVal as unknown[]).map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
				showMessages(msgs);
				return;
			}
			if (typeof errorVal === "string") {
				antdMessage.error(errorVal);
				return;
			}
			// fallback: stringify whatever we got
			antdMessage.error(JSON.stringify(errorVal));
			return;
		}

		// last fallback for axios responses
		antdMessage.error(JSON.stringify(respData) || "Something went wrong");
		return;
	}

	// Non-Axios errors
	try {
		const asString = typeof error === "string" ? error : JSON.stringify(error);
		antdMessage.error(asString || "Something went wrong");
	} catch {
		antdMessage.error("Something went wrong");
	}
}

export default showValidationErrors;
