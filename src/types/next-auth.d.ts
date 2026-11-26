import {DefaultSession, DefaultUser} from "next-auth";
import {DefaultJWT} from "next-auth/jwt";

type TDonorStatus = "PENDING" | "APPROVED" | "REJECTED";

declare module "next-auth" {
	interface User extends DefaultUser {
		role?: string | null;
		organisationId?: string | null;
		isApprovedNgo?: boolean | null;
		donorId?: string | null;
		donorStatus?: TDonorStatus | null;
	}

	interface Session extends DefaultSession {
		user: {
			id?: string | null;
			role?: string | null;
			organisationId?: string | null;
			isApprovedNgo?: boolean | null;
			donorId?: string | null;
			donorStatus?: TDonorStatus | null;
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT extends DefaultJWT {
		id?: string | null;
		role?: string | null;
		organisationId?: string | null;
		isApprovedNgo?: boolean | null;
		donorId?: string | null;
		donorStatus?: TDonorStatus | null;
	}
}
