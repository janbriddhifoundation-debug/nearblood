import * as Yup from "yup";

export const ngoRegSchema = Yup.object({
	name: Yup.string().required("Enter name"),
	type: Yup.string().required("Please select type"),
	regNo: Yup.string().required("Enter registration number"),
	estDate: Yup.date().nullable().required("Select date"),
	address: Yup.string().required("Enter address"),
	website: Yup.string().nullable(),
	regCertFilename: Yup.string().required("Registration certificate is required"),
	regionCovered: Yup.array().min(1, "Select region").required(),
	contactName: Yup.string().required("Enter contact name"),
	designation: Yup.string().required("Enter designation"),
	email: Yup.string().email("Enter valid email").required("Enter email"),
	phone: Yup.string().required("Enter phone number"),
	govtIdFilename: Yup.string().required("A valid Govt. ID is required"),
});

export const donorRegSchema = Yup.object().shape({
	name: Yup.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name can't exceed 100 characters").required("Name is required"),

	gender: Yup.string().oneOf(["male", "female", "other"], "Invalid gender").required("Gender is required"),

	email: Yup.string().trim().email("Invalid email address").required("Email is required"),

	phone: Yup.string()
		.trim()
		.matches(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number")
		.required("Phone is required"),

	dob: Yup.date().required("Date of birth is required"),

	bloodGroup: Yup.string().oneOf(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], "Invalid blood group").required("Blood group is required"),

	address: Yup.string().trim().min(10, "Address must be at least 10 characters").required("Address is required"),

	photo: Yup.string().required("Photo is required"),

	// Optional: when the donor last gave blood (outside NearBlood too), for eligibility
	lastDonatedAt: Yup.date()
		.nullable()
		.transform((value, originalValue) => (originalValue === "" ? null : value))
		// Checked at validation time (not module load) so "today" stays current on a long-running server
		.test("not-in-future", "Last donation date can't be in the future", (value) => !value || value <= new Date()),
});

export const assignDonorsSchema = Yup.object().shape({
	donorIds: Yup.array().of(Yup.string().required("Donor ID is required")),
	requestId: Yup.string().required("Request ID is required"),
});
