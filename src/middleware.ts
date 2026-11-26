import {NextResponse} from "next/server";
import {auth} from "./auth";

export async function middleware(req: Request) {
	const session = await auth();
	const url = new URL(req.url);
	const path = url.pathname;

	// Define protected paths for different roles
	const userPaths = ["/user"];
	const ngoPaths = ["/ngo"];
	const adminPaths = ["/admin"];

	console.log("Middleware session:", session);

	// Check if the current path matches any protected route
	if (userPaths.some((p) => path.startsWith(p))) {
		// User routes - only accessible to users with "user" role
		if (!session?.user) {
			return NextResponse.redirect(new URL("/", req.url));
		}

		if (session.user.role !== "user") {
			// Redirect to appropriate dashboard based on role
			if (session.user.role === "ngo") {
				return NextResponse.redirect(new URL("/ngo/dashboard", req.url));
			} else if (session.user.role === "admin") {
				return NextResponse.redirect(new URL("/admin/dashboard", req.url));
			} else {
				// No role assigned, redirect to home to select role
				return NextResponse.redirect(new URL("/", req.url));
			}
		}
	}

	if (ngoPaths.some((p) => path.startsWith(p))) {
		// NGO routes - only accessible to users with "ngo" role
		if (!session?.user) {
			return NextResponse.redirect(new URL("/", req.url));
		}

		if (session.user.role !== "ngo") {
			// Redirect to appropriate dashboard based on role
			if (session.user.role === "user") {
				return NextResponse.redirect(new URL("/user/dashboard", req.url));
			} else if (session.user.role === "admin") {
				return NextResponse.redirect(new URL("/admin/dashboard", req.url));
			} else {
				// No role assigned, redirect to home to select role
				return NextResponse.redirect(new URL("/", req.url));
			}
		} else {
			if (!!!session.user.organisationId) {
				// NGO without organisation - redirect to registration
				if (!path.startsWith("/ngo/registration")) {
					return NextResponse.redirect(new URL("/ngo/registration", req.url));
				}
			} else if (session.user.isApprovedNgo === false) {
				// NGO with unapproved organisation - redirect to awaiting approval
				if (!path.startsWith("/ngo/awaiting-approval")) {
					return NextResponse.redirect(new URL("/ngo/awaiting-approval", req.url));
				}
			} else if (session.user.isApprovedNgo === true) {
				// Approved NGO - prevent access to registration and awaiting approval pages
				if (path.startsWith("/ngo/registration") || path.startsWith("/ngo/awaiting-approval")) {
					return NextResponse.redirect(new URL("/ngo/dashboard", req.url));
				}
			}
		}
	}

	if (adminPaths.some((p) => path.startsWith(p))) {
		// Admin routes - only accessible to users with "admin" role
		if (!session?.user) {
			return NextResponse.redirect(new URL("/", req.url));
		}

		if (session.user.role !== "admin") {
			// Redirect to appropriate dashboard based on role
			if (session.user.role === "user") {
				return NextResponse.redirect(new URL("/user/dashboard", req.url));
			} else if (session.user.role === "ngo") {
				return NextResponse.redirect(new URL("/ngo/dashboard", req.url));
			} else {
				// No role assigned, redirect to home to select role
				return NextResponse.redirect(new URL("/", req.url));
			}
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/user/:path*", "/admin/:path*", "/ngo/:path*"],
};
