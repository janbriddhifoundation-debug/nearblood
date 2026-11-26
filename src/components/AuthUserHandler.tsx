"use client";

import {useSession} from "next-auth/react";

export function AuthUserHandler() {
	const {data: session, status} = useSession();

	// This component is now simplified since the auth callback handles user upsert
	// We can log the session for debugging purposes
	if (status === "authenticated" && session?.user) {
		console.log("Current session:", session);
	}

	return null; // This component doesn't render anything
}
