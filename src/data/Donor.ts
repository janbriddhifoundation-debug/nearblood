// Donor sign-up shows NGOs covering a region within this distance of the donor
export const NEARBY_NGO_RADIUS_KM = 25;

// Minimum gap between whole-blood donations (NBTC India guideline)
export const DONATION_GAP_DAYS = {male: 90, female: 120, other: 90} as const;

export const DONOR_STATUS_LABELS = {
	PENDING: {label: "Pending", color: "gold"},
	APPROVED: {label: "Approved", color: "green"},
	REJECTED: {label: "Rejected", color: "red"},
} as const;
