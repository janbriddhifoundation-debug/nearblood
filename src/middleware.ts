import {NextResponse} from "next/server";
import {auth} from "./auth";
import {getDashboardPath, isPersonalRole} from "@/utils/roleRoutes";

const DONOR_ONBOARDING_PATHS = ["/donor/registration", "/donor/awaiting-approval"];

export async function middleware(req: Request) {
	const session = await auth();
	const url = new URL(req.url);
	const path = url.pathname;

	const redirectTo = (target: string) => NextResponse.redirect(new URL(target, req.url));

	if (!session?.user) {
		return redirectTo("/");
	}

	const {role, organisationId, isApprovedNgo, donorId, donorStatus} = session.user;

	// Requester area - any personal account (requester or donor) can request blood
	if (path.startsWith("/user")) {
		if (!isPersonalRole(role)) {
			return redirectTo(getDashboardPath(role));
		}
	}

	// Donor area - personal accounts; onboarding depends on the linked donor profile
	if (path.startsWith("/donor")) {
		if (!isPersonalRole(role)) {
			return redirectTo(getDashboardPath(role));
		}

		const isOnboardingPath = DONOR_ONBOARDING_PATHS.some((p) => path.startsWith(p));

		if (!donorId) {
			// No donor profile yet - only the registration page is available
			if (!path.startsWith("/donor/registration")) {
				return redirectTo("/donor/registration");
			}
		} else if (donorStatus === "APPROVED") {
			if (isOnboardingPath) {
				return redirectTo("/donor/dashboard");
			}
		} else if (donorStatus === "REJECTED") {
			// Rejected donors can re-apply to another NGO
			if (!isOnboardingPath) {
				return redirectTo("/donor/awaiting-approval");
			}
		} else if (!path.startsWith("/donor/awaiting-approval")) {
			// Pending
			return redirectTo("/donor/awaiting-approval");
		}
	}

	if (path.startsWith("/ngo")) {
		if (role !== "ngo") {
			return redirectTo(getDashboardPath(role));
		}

		if (!organisationId) {
			// NGO without organisation - redirect to registration
			if (!path.startsWith("/ngo/registration")) {
				return redirectTo("/ngo/registration");
			}
		} else if (!isApprovedNgo) {
			// NGO with unapproved organisation - redirect to awaiting approval
			if (!path.startsWith("/ngo/awaiting-approval")) {
				return redirectTo("/ngo/awaiting-approval");
			}
		} else if (path.startsWith("/ngo/registration") || path.startsWith("/ngo/awaiting-approval")) {
			// Approved NGO - registration and awaiting approval are done
			return redirectTo("/ngo/dashboard");
		}
	}

	if (path.startsWith("/admin")) {
		if (role !== "admin") {
			return redirectTo(getDashboardPath(role));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/user/:path*", "/admin/:path*", "/ngo/:path*", "/donor/:path*"],
};
