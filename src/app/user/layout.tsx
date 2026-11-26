"use client";

import React, {useState, useEffect} from "react";
import {Avatar, Layout, Menu, Drawer, Button, Grid} from "antd";
import {CustomerServiceOutlined, DashboardOutlined, FileTextOutlined, HeartOutlined, LikeOutlined, LogoutOutlined, UploadOutlined, UserOutlined, MenuOutlined} from "@ant-design/icons";
import {usePathname} from "next/navigation";
import {signOut, useSession} from "next-auth/react";
import Show from "@/components/Show";
import NotificationBell from "@/components/NotificationBell";
import {useRouter} from "next-nprogress-bar";

const {Sider, Content, Header} = Layout;
const {useBreakpoint} = Grid;

const styles = {
	layout: {minHeight: "100vh"},
	sider: {
		borderRight: "1px solid #D9D9D9",
		padding: "0px 12px",
		width: 280,
	},
	siderHeader: {
		height: 64,
		padding: 16,
		fontWeight: "bold",
		display: "flex",
		alignItems: "center",
	},
	menu: {borderInlineEnd: "none"},
	header: {
		background: "#fff",
		padding: "0 24px",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		borderBottom: "1px solid #D9D9D9",
	},
	userInfo: {
		display: "flex",
		alignItems: "center",
		gap: 12,
	},
	content: {
		background: "#fff",
		padding: 12,
	},
};

const UserLayout = ({children}: {children: React.ReactNode}) => {
	const router = useRouter();
	const pathname = usePathname();
	const {data: session} = useSession();
	const screens = useBreakpoint();

	const [drawerVisible, setDrawerVisible] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	const user = {
		name: session?.user?.name || "Guest",
		avatarUrl: session?.user?.image || "",
	};

	const menuItems = [
		{key: "/user/dashboard", icon: <DashboardOutlined />, label: "Dashboard"},
		{key: "/user/request", icon: <FileTextOutlined />, label: "Request"},
		{
			key: "/user/upload-proof",
			icon: <UploadOutlined />,
			label: "Upload Proof",
		},
		{
			key: "/user/support-initiative",
			icon: <LikeOutlined />,
			label: "Support Initiative",
		},
		{key: "/user/support", icon: <CustomerServiceOutlined />, label: "Help & support"},
		// Same account can also be a donor
		session?.user?.donorId
			? {key: "/donor/dashboard", icon: <HeartOutlined />, label: "Donor dashboard"}
			: {key: "/donor/registration", icon: <HeartOutlined />, label: "Become a donor"},
		{key: "/logout", icon: <LogoutOutlined />, label: "Logout"},
	];


	const handleMenuClick = ({key}: {key: string}) => {
		if (key === "/logout") {
			signOut();
		} else {
			router.push(key);
		}
		setDrawerVisible(false); // close drawer on navigation (for mobile)
	};

	// Watch screen size to toggle between mobile/desktop layout
	useEffect(() => {
		setIsMobile(!screens.lg); // lg = 992px breakpoint
	}, [screens]);

	return (
		<Layout style={styles.layout}>
			{/* --- Sidebar for Desktop --- */}
			<Show IF={!isMobile}>
				<Sider theme="light" width={280} style={styles.sider}>
					<div style={styles.siderHeader}>User Panel</div>
					<Menu mode="inline" style={styles.menu} selectedKeys={[pathname]} items={menuItems} onClick={handleMenuClick} />
				</Sider>
			</Show>

			{/* --- Drawer Sidebar for Mobile --- */}
			<Show IF={isMobile}>
				<Drawer title="User Panel" placement="left" closable onClose={() => setDrawerVisible(false)} open={drawerVisible} styles={{body: {padding: 0}}}>
					<Menu mode="inline" selectedKeys={[pathname]} items={menuItems} onClick={handleMenuClick} />
				</Drawer>
			</Show>

			{/* --- Main Layout --- */}
			<Layout>
				<Header style={styles.header}>
					<div style={{display: "flex", alignItems: "center", gap: 16}}>
						<Show IF={isMobile}>
							<Button type="text" icon={<MenuOutlined style={{fontSize: 20}} />} onClick={() => setDrawerVisible(true)} />
						</Show>
					</div>

					<div style={{display: "flex", alignItems: "center", gap: 24}}>
						<NotificationBell />

						<div style={styles.userInfo}>
							<span style={{fontWeight: 500}}>{user.name}</span>
							<Avatar size="large" icon={<UserOutlined />} src={user.avatarUrl || undefined} />
						</div>
					</div>
				</Header>

				<Content style={styles.content}>{children}</Content>
			</Layout>
		</Layout>
	);
};

export default UserLayout;
