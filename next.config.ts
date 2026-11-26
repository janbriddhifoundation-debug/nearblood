// next.config.ts
import type {NextConfig} from "next";
import {withSentryConfig} from "@sentry/nextjs";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
				pathname: "/**",
			},
		],
	},
	webpack: (config, {isServer}) => {
		if (isServer) {
			config.module.exprContextCritical = false;
		}
		return config;
	},
};

const sentryWebpackPluginOptions = {
	silent: !process.env.CI,
	org: "debarshi-das",
	project: "floating-blood-bank",
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	disableLogger: true,
	automaticVercelMonitors: true,
};

export default process.env.NODE_ENV === "development" ? nextConfig : withSentryConfig(nextConfig, sentryWebpackPluginOptions);
