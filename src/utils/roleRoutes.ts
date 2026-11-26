export type TRole = "admin" | "ngo" | "user" | "donor";

// Roles a person can pick for themselves at sign-up. "admin" is only ever set in the database.
export const SELF_SELECTABLE_ROLES: TRole[] = ["user", "donor", "ngo"];

// "user" (requester) and "donor" are both personal accounts: they can request blood and can hold a donor profile.
export const PERSONAL_ROLES: string[] = ["user", "donor"];

export function isPersonalRole(role?: string | null): boolean {
	return !!role && PERSONAL_ROLES.includes(role);
}

// Default landing page for each role. Middleware takes care of onboarding redirects (registration, awaiting approval).
export function getDashboardPath(role?: string | null): string {
	switch (role) {
		case "admin":
			return "/admin/dashboard";
		case "ngo":
			return "/ngo/dashboard";
		case "donor":
			return "/donor/dashboard";
		case "user":
			return "/user/dashboard";
		default:
			return "/";
	}
}
