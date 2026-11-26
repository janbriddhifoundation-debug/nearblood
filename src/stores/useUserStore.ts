import {create} from "zustand";

type Organisation = {
	id: string;
	name: string;
	type: string;
	regNo: string;
	estDate: string;
	address: string;
	website: string;
	regCertFilename: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	approvedAt: string | null;
};

type User = {
	id: string;
	name: string;
	email: string;
	image: string;
	role: "ngo" | "admin" | "user";
	isApprovedNgo: boolean;
	organisation: Organisation | null;
} | null;

interface UserStore {
	user: User;
	setUser: (user: User) => void;
	clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
	user: null,
	setUser: (user) => set({user}),
	clearUser: () => set({user: null}),
}));
