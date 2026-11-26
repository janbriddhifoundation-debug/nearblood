"use client";
import {DashboardOutlined, GoogleOutlined, LoadingOutlined, LogoutOutlined} from "@ant-design/icons";
import {Button} from "antd";
import React, {useEffect, useState} from "react";

import {signIn, signOut, useSession} from "next-auth/react";
import Link from "next/link";
import Show from "./Show";
import RoleSelectModal from "./RoleSelectModal";
import Image from "next/image";
import {getDashboardPath, TRole} from "@/utils/roleRoutes";

const AuthButtons = () => {
	const {status, data: session} = useSession();
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [intentRole, setIntentRole] = useState<TRole | undefined>(undefined);

	// Full reload so the session picks up the new role, then middleware routes to the right onboarding step
	const handleRoleUpdated = (role: TRole) => {
		window.location.href = getDashboardPath(role);
	};

	useEffect(() => {
		if (!session?.user?.role && status === "authenticated") {
			// Home page CTAs sign in with ?intent=<role> so the right role is preselected
			const intent = new URLSearchParams(window.location.search).get("intent");
			if (intent === "donor" || intent === "user" || intent === "ngo") {
				setIntentRole(intent);
			}
			setShowRoleModal(true);
		}
	}, [session?.user?.role, status]);

	return (
		<>
			<Show IF={status === "loading"}>
				<Button icon={<LoadingOutlined />} type="primary">
					Loading...
				</Button>
			</Show>

			<Show IF={!session && status !== "loading"}>
				<Button icon={<GoogleOutlined />} onClick={() => signIn("google")} type="primary">
					Login with Google
				</Button>
			</Show>

			<Show IF={!!session && status === "authenticated"}>
				<div className="flex gap-4 items-center">
					<Show IF={!!session?.user?.image}>
						<Image src={session?.user?.image ?? ""} alt="User Avatar" width={36} height={36} className="rounded-full" />
					</Show>

					<div className="space-x-4">
						<Link href={getDashboardPath(session?.user?.role)}>
							<Button disabled={!session?.user?.role} type="primary" icon={<DashboardOutlined />}>
								Dashboard
							</Button>
						</Link>
						<Button icon={<LogoutOutlined />} onClick={() => signOut()}>
							Logout
						</Button>
					</div>
				</div>

				<RoleSelectModal isOpen={showRoleModal} defaultRole={intentRole} onRoleUpdated={handleRoleUpdated} />
			</Show>
		</>
	);
};

export default AuthButtons;
