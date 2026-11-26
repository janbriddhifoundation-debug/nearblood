import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		tracesSampleRate: 1.0,
		debug: false,
	});
} else if (process.env.NODE_ENV === "development") {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		tracesSampleRate: 1.0,
		debug: true,
	});
}
