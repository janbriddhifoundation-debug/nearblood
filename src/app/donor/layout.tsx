"use client";

import React, {useState} from "react";
import Image from "next/image";
import {usePathname} from "next/navigation";
import {signOut, useSession} from "next-auth/react";
import {useRouter} from "next-nprogress-bar";
import {Avatar, Button, Drawer, Grid, Layout, Menu, MenuProps} from "antd";
import {CalendarOutlined, CustomerServiceOutlined, DashboardOutlined, HeartOutlined, HistoryOutlined, LogoutOutlined, MenuOutlined, SafetyCertificateOutlined, UserOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import NotificationBell from "@/components/NotificationBell";

const {Sider, Content, Header} = Layout;
const {useBreakpoint} = Grid;

const ONBOARDING_PATHS = ["/donor/registration", "/donor/awaiting-approval"];

const MENU_ITEMS: MenuProps["items"] = [
	{key: "/donor/dashboard", icon: <DashboardOutlined />, label: "Dashboard"},
	{key: "/donor/donations", icon: <HistoryOutlined />, label: "My donations"},
	{key: "/donor/certificates", icon: <SafetyCertificateOutlined />, label: "Certificates"},
	{key: "/donor/camps", icon: <CalendarOutlined />, label: "Blood camps"},
	{key: "/donor/profile", icon: <UserOutlined />, label: "Profile"},
	{key: "/donor/support", icon: <CustomerServiceOutlined />, label: "Help & support"},
	{type: "divider"},
	{key: "/user/dashboard", icon: <HeartOutlined />, label: "Request blood"},
	{key: "/logout", icon: <LogoutOutlined />, label: "Logout"},
];

const DonorLayout = ({children}: {children: React.ReactNode}) => {
	const router = useRouter();
	const pathname = usePathname();
	const {data: session} = useSession();
	const screens = useBreakpoint();
	const [drawerOpen, setDrawerOpen] = useState(false);

	// lg breakpoint is undefined on the first render; treat that as desktop to avoid a flash
	const isMobile = screens.lg === false;
	const selectedKey = MENU_ITEMS?.find((item) => item && "key" in item && typeof item.key === "string" && pathname.startsWith(item.key))?.key as string | undefined;

	const handleMenuClick = ({key}: {key: string}) => {
		setDrawerOpen(false);
		if (key === "/logout") {
			signOut({callbackUrl: "/"});
		} else {
			router.push(key);
		}
	};

	if (ONBOARDING_PATHS.some((path) => pathname.startsWith(path))) {
		return <>{children}</>;
	}

	const menu = <Menu mode="inline" className="!border-none" selectedKeys={selectedKey ? [selectedKey] : []} items={MENU_ITEMS} onClick={handleMenuClick} />;

	return (
		<Layout className="min-h-screen">
			<Show IF={!isMobile}>
				<Sider theme="light" width={260} className="!border-r !border-[#D9D9D9] !px-3">
					<div className="h-16 flex items-center px-4">
						<Image src="/sitelogo.png" alt="NearBlood" width={200} height={100} className="w-[140px] object-contain" />
					</div>
					{menu}
				</Sider>
			</Show>

			<Show IF={isMobile}>
				<Drawer title="Donor" placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} styles={{body: {padding: 0}}}>
					{menu}
				</Drawer>
			</Show>

			<Layout>
				<Header className="!bg-white !px-6 flex items-center justify-between border-b border-[#D9D9D9]">
					<div>
						<Show IF={isMobile}>
							<Button type="text" aria-label="Open menu" icon={<MenuOutlined className="text-xl" />} onClick={() => setDrawerOpen(true)} />
						</Show>
					</div>
					<div className="flex items-center gap-3">
						<NotificationBell />
						<span className="font-medium hidden sm:inline">{session?.user?.name}</span>
						<Avatar size="large" icon={<UserOutlined />} src={session?.user?.image || undefined} alt={session?.user?.name ?? "Donor"} />
					</div>
				</Header>
				<Content className="!bg-gray-50">{children}</Content>
			</Layout>
		</Layout>
	);
};

export default DonorLayout;
