import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// Note: Avoid importing Prisma here because NextAuth callbacks run in the Edge
// runtime on some deployments (like Vercel Edge) where Prisma (Node) is not
// supported. Role fetching should happen via an HTTP call or in a Node-only
// handler.

export const {handlers, signIn, signOut, auth} = NextAuth({
	providers: [Google],
	callbacks: {
		async jwt({token, user}) {
			// Store basic user info
			if (user) {
				token.id = user.id;
				token.email = user.email;
			}
			return token;
		},

		async session({session, token}) {
			if (session.user && token.email) {
				session.user.id = token.id as string;
				session.user.email = token.email;

				// Prefer role stored on the token (set at sign-in / jwt creation).
				// Fallback to fetching from /api/auth/get-user only if role is missing.
				if (token.role) {
					session.user.role = token.role as string;
				} else {
					const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002");
					try {
						const fetchUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/get-user?email=${encodeURIComponent(token.email)}`;
						const response = await fetch(fetchUrl);
						if (response.ok) {
							const userData = await response.json();
							if (userData.user) {
								session.user.role = userData.user.role;
								session.user.organisationId = userData.user.organisationId;
								session.user.isApprovedNgo = userData.user.isApprovedNgo;
							}
						} else {
							console.error(`Failed to fetch user role from ${fetchUrl} - status: ${response.status} ${response.statusText}`);
						}
					} catch (error) {
						console.error("Error fetching user role in session:", error);
					}
				}
			}
			return session;
		},
	},
});
