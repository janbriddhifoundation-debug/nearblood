"use client";
import {DashboardOutlined, GoogleOutlined, LoadingOutlined, LogoutOutlined} from "@ant-design/icons";
import {Button} from "antd";
import React, {useEffect, useState} from "react";

import {signIn, signOut, useSession} from "next-auth/react";
import Link from "next/link";
import Show from "./Show";
import RoleSelectModal from "./RoleSelectModal";
import Image from "next/image";

const AuthButtons = () => {
	const {status, data: session} = useSession();
	const [showRoleModal, setShowRoleModal] = useState(false);

	const handleRoleUpdated = () => {
		// Refresh the page to update the user data
		window.location.reload();
	};

	useEffect(() => {
		if (!session?.user?.role && status === "authenticated") {
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
				<>
					<div className="flex gap-4 items-center">
						<div>
							<Show IF={!!session?.user?.image}>
								<Image src={session?.user?.image ?? ""} alt="User Avatar" width={36} height={36} className="rounded-full" />
							</Show>
						</div>

						<div className="space-x-4">
							<Link href={session?.user?.role && session?.user?.role === "ngo" ? "/ngo/dashboard" : "/user/dashboard"}>
								<Button disabled={!session?.user?.role} type="primary" icon={<DashboardOutlined />}>
									Dashboard
								</Button>
							</Link>
							<Button icon={<LogoutOutlined />} onClick={() => signOut()}>
								Logout
							</Button>
						</div>
					</div>
				</>

				<RoleSelectModal isOpen={showRoleModal} userName={session?.user?.name} userImage={session?.user?.image} userEmail={session?.user?.email} onRoleUpdated={handleRoleUpdated} />
			</Show>
		</>
	);
};

export default AuthButtons;
