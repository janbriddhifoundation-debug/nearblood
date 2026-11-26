import type {Metadata} from "next";
import {AntdRegistry} from "@ant-design/nextjs-registry";
import {App, ConfigProvider} from "antd";
import "@ant-design/v5-patch-for-react-19";
import "antd/dist/reset.css";
import "./globals.css";
import {SessionProvider} from "next-auth/react";

// new import for map
import "leaflet/dist/leaflet.css";
import Providers from "./providers";

export const metadata: Metadata = {
	title: "NearBlood",
	description: "A platform connecting blood donors with those in need.",
	icons: {
		icon: [{url: "/favicon.png", type: "image/png"}],
		shortcut: "/favicon.png",
		apple: "/favicon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.png" type="image/png" />
			</head>
			<body className="antialiased">
				<AntdRegistry>
					<ConfigProvider
						theme={{
							token: {
								colorPrimary: "#ff0000",
							},
						}}>
						<SessionProvider>
							<Providers>
								<App>{children}</App>
							</Providers>
						</SessionProvider>
					</ConfigProvider>
				</AntdRegistry>
			</body>
		</html>
	);
}
