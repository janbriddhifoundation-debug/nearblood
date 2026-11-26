"use client";

import {useCallback} from "react";
import {signIn, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {message} from "antd";
import {getDashboardPath, isPersonalRole} from "@/utils/roleRoutes";

// Public CTAs ("Become a donor", "Register NGO"): signs in if needed (preselecting the role),
// then sends the person to the right place for the account they already have.
export function useJoinAs() {
	const {data: session, status} = useSession();
	const router = useRouter();

	return useCallback(
		(target: "donor" | "ngo") => {
			if (status !== "authenticated") {
				signIn("google", {callbackUrl: `/?intent=${target}`});
				return;
			}

			const role = session?.user?.role;

			if (!role) {
				// Role pop-up is already open on the page
				message.info("Please choose your role to continue");
				return;
			}

			if (target === "donor") {
				if (isPersonalRole(role)) {
					router.push("/donor/dashboard");
				} else {
					message.info("NGO and admin accounts can't register as donors. Please sign in with a personal Google account to donate.");
				}
				return;
			}

			if (role === "ngo") {
				router.push("/ngo/dashboard");
			} else {
				message.info("This account is a personal account. Please sign in with your organisation's Google account to register an NGO.");
				router.push(getDashboardPath(role));
			}
		},
		[router, session?.user?.role, status],
	);
}
