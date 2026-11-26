import * as Sentry from "@sentry/nextjs";

export async function register() {
	// Server runtime (Node.js: API routes, RSC server components)
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("../sentry.server.config");
	}

	// Edge runtime (middleware, edge routes)
	if (process.env.NEXT_RUNTIME === "edge") {
		await import("../sentry.edge.config");
	}

	// Client runtime (browser React components)
	if (typeof window !== "undefined") {
		await import("./instrumentation-client");
	}
}

// Capture request errors in App Router API routes
export const onRequestError = Sentry.captureRequestError;
