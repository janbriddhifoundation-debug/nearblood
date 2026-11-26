"use client";

import {useEffect, useState, useCallback} from "react";
import {usePathname, useRouter} from "next/navigation";
import {useSession, signOut} from "next-auth/react";
import axios from "axios";
import { useUserStore } from "@/stores/useUserStore";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, Layout, Menu, Spin } from "antd";
import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  ProfileOutlined,
  DatabaseOutlined,
  CustomerServiceOutlined,
  FundOutlined,
} from "@ant-design/icons";

const {Sider, Content, Header} = Layout;

const styles = {
	layout: {minHeight: "100vh"},
	sider: {borderRight: "1px solid #D9D9D9", padding: "0px 12px", width: 280},
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
		justifyContent: "flex-end",
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
		padding: 24,
	},
};

export default function NgoLayout({children}: {children: React.ReactNode}) {
	const {status} = useSession();
	const router = useRouter();
	const pathname = usePathname();

	const user = useUserStore((state) => state.user);
	const setUser = useUserStore((state) => state.setUser);
	const [loading, setLoading] = useState(false);

	const menuItems = [
		{
			key: "/admin/dashboard",
			icon: <DashboardOutlined />,
			label: "Dashboard",
		},
		{
			key: "/admin/blood-request-monitoring",
			icon: <FundOutlined />,
			label: "Blood request monitoring",
		},
		{
			key: "/admin/ngo-management",
			icon: <TeamOutlined />,
			label: "Ngo management",
		},
		{
			key: "/admin/user-management",
			icon: <UserOutlined />,
			label: "User management",
		},
		{
			key: "/admin/donor-donation-oversight",
			icon: <AuditOutlined />,
			label: "Donar donation oversight",
		},
		{
			key: "/admin/proof-verification",
			icon: <SafetyCertificateOutlined />,
			label: "proof & verification control",
		},
		{
			key: "/admin/certificates-branding",
			icon: <ProfileOutlined />,
			label: "Certificate & branding",
		},
		{
			key: "/admin/events-management",
			icon: <CalendarOutlined />,
			label: "Events management",
		},
		{
			key: "/admin/reports-analytics",
			icon: <BarChartOutlined />,
			label: "Reports & analytics",
		},
		{
			key: "/admin/setting-configuration",
			icon: <SettingOutlined />,
			label: "Setting & configuration",
		},
		{
			key: "/admin/logs",
			icon: <DatabaseOutlined />,
			label: "Logs",
		},
		{
			key: "/admin/staff-management",
			icon: <TeamOutlined />,
			label: "Staff management",
		},
		{
			key: "/admin/support-grievance",
			icon: <CustomerServiceOutlined />,
			label: "Support & grievance",
		},
		{
			key: "/logout",
			icon: <LogoutOutlined />,
			label: "Logout",
		},
	];


	const handleMenuClick = ({key}: {key: string}) => {
		if (key === "/logout") {
			signOut();
		} else {
			router.push(key);
		}
	};

	const fetchUser = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/get-me");
			setUser(data.user);
		} catch (err) {
			console.error("Error fetching user:", err);
			signOut({callbackUrl: "/"});
		} finally {
			setLoading(false);
		}
	}, [setUser]);

	useEffect(() => {
		if (status === "authenticated" && !user) {
			fetchUser();
		} else if (status === "unauthenticated") {
			signOut({callbackUrl: "/"});
		}
	}, [status, user, fetchUser]);

	if (status === "loading" || loading) {
		return (
			<div className="p-4 flex flex-col gap-4 items-center justify-center h-screen">
				<Spin />
				<span>Loading</span>
			</div>
		);
	}

	return (
		<Layout style={styles.layout}>
			<Sider theme="light" width={280} style={styles.sider}>
				<div style={styles.siderHeader}>{`Admin`}</div>
				<Menu mode="inline" style={styles.menu} selectedKeys={[pathname]} items={menuItems} onClick={handleMenuClick} />
			</Sider>
			<Layout>
				<Header style={styles.header}>
					<div>
						<NotificationBell />
					</div>
					<div style={styles.userInfo}>
						<span style={{fontWeight: 500}}>{user?.name}</span>
						<Avatar size="large" icon={<UserOutlined />} src={user?.image || undefined} />
					</div>
				</Header>
				<Content style={styles.content}>{children}</Content>
			</Layout>
		</Layout>
	);
}
