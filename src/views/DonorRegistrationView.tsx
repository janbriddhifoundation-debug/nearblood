"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import Image from "next/image";
import {useFormik} from "formik";
import {useSession} from "next-auth/react";
import {Alert, Button, Card, DatePicker, Input, Select, Spin, Steps, message} from "antd";
import {ArrowLeftOutlined, ArrowRightOutlined, LinkOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import LocationAutoComplete from "@/components/LocationAutoComplete";
import DonorPhotoUpload from "@/components/Donor/DonorPhotoUpload";
import NgoPicker from "@/components/Donor/NgoPicker";
import {BLOOD_GROUPS} from "@/data/Others";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {showValidationErrors} from "@/utils/showValidationErrors";
import {zodFormikValidate} from "@/utils/zodFormikValidate";
import {DONOR_MAX_AGE, DONOR_MIN_AGE, donorSelfRegistrationSchema} from "@/validationSchema/donorSchema";

const {TextArea} = Input;

type TFormValues = {
	name: string;
	gender: string;
	phone: string;
	dob: string;
	bloodGroup: string;
	address: string;
	photo?: string;
	locationName: string;
	latitude?: number;
	longitude?: number;
	// Only used to find NGOs in the same city; not stored
	city?: string | null;
	organisationId: string;
};

type TOnboardingState = {
	donor: {status: "PENDING" | "APPROVED" | "REJECTED"; Organisation: {name: string | null} | null} | null;
	claimable: {name: string | null; bloodGroup: string | null; organisationName: string | null} | null;
};

const DETAIL_FIELDS: (keyof TFormValues)[] = ["name", "gender", "phone", "dob", "bloodGroup", "address", "locationName", "latitude", "longitude"];

const DonorRegistrationView = () => {
	const {data: session} = useSession();
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(true);
	const [claiming, setClaiming] = useState(false);
	const [onboarding, setOnboarding] = useState<TOnboardingState>({donor: null, claimable: null});

	const formik = useFormik<TFormValues>({
		initialValues: {name: "", gender: "", phone: "", dob: "", bloodGroup: "", address: "", photo: undefined, locationName: "", latitude: undefined, longitude: undefined, city: null, organisationId: ""},
		validate: zodFormikValidate<TFormValues>(donorSelfRegistrationSchema),
		onSubmit: async (values) => {
			try {
				await axios.post("/api/v1/donor/registration", values);
				message.success("Registration submitted to the NGO");
				// Full reload so the session picks up the new donor profile
				window.location.href = "/donor/awaiting-approval";
			} catch (error) {
				showValidationErrors(error);
			}
		},
	});

	const fetchOnboarding = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/donor/registration");
			setOnboarding({donor: data?.donor ?? null, claimable: data?.claimable ?? null});
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchOnboarding();
	}, [fetchOnboarding]);

	useEffect(() => {
		if (session?.user?.name && !formik.values.name) {
			void formik.setFieldValue("name", session.user.name, false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.name]);

	const handleClaim = async () => {
		try {
			setClaiming(true);
			await axios.post("/api/v1/donor/registration/claim");
			message.success("Your donor profile is linked");
			window.location.href = "/donor/dashboard";
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setClaiming(false);
		}
	};

	const handleNext = async () => {
		const errors = await formik.validateForm();
		const stepErrors = DETAIL_FIELDS.filter((field) => errors[field]);

		formik.setTouched(DETAIL_FIELDS.reduce((acc, field) => ({...acc, [field]: true}), {}), false);

		if (stepErrors.length === 0) setStep(1);
	};

	const getError = (field: keyof TFormValues) => (formik.touched[field] && formik.errors[field] ? <div className="text-red-500 text-xs py-1">{formik.errors[field]}</div> : null);

	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-10 px-4">
			<div className="max-w-3xl mx-auto">
				<div className="flex justify-center mb-6">
					<Image src="/sitelogo.png" alt="NearBlood" width={200} height={100} className="w-[160px] object-contain" />
				</div>

				<Card className="!rounded-xl !shadow-lg">
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Become a blood donor</h1>
					<p className="text-gray-600 mt-1 mb-6">Register once, choose an NGO near you, and they will reach out when someone nearby needs your blood group.</p>

					{/* NGO already added this person - link instead of creating a duplicate */}
					<Show IF={!!onboarding.claimable}>
						<Alert
							type="info"
							showIcon
							className="!mb-6"
							message={`${onboarding.claimable?.organisationName ?? "An NGO"} has already registered you as a donor`}
							description={
								<div>
									<p className="mb-3">
										We found a donor record for your email ({onboarding.claimable?.name}, {onboarding.claimable?.bloodGroup}). Link it to your account to see your donations and certificates. If this isn&apos;t you, please contact that NGO.
									</p>
									<Button type="primary" icon={<LinkOutlined />} loading={claiming} onClick={handleClaim}>
										Link my donor profile
									</Button>
								</div>
							}
						/>
					</Show>

					<Show IF={!onboarding.claimable}>
						<Show IF={onboarding.donor?.status === "REJECTED"}>
							<Alert type="warning" showIcon className="!mb-6" message={`${onboarding.donor?.Organisation?.name ?? "The NGO"} did not approve your previous application`} description="You can apply again and choose another NGO." />
						</Show>

						<Steps current={step} className="!mb-8" items={[{title: "Your details"}, {title: "Choose an NGO"}]} />

						<form onSubmit={formik.handleSubmit}>
							<Show IF={step === 0}>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block font-medium mb-1 text-gray-600">Full name</label>
										<Input name="name" placeholder="Enter full name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} />
										{getError("name")}
									</div>

									<div>
										<label className="block font-medium mb-1 text-gray-600">Phone</label>
										<Input name="phone" placeholder="10-digit mobile number" addonBefore="+91" maxLength={10} value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />
										{getError("phone")}
									</div>

									<div>
										<label className="block font-medium mb-1 text-gray-600">Gender</label>
										<Select
											className="w-full"
											placeholder="Select gender"
											value={formik.values.gender || undefined}
											onChange={(value) => formik.setFieldValue("gender", value)}
											onBlur={() => formik.setFieldTouched("gender", true)}
											options={[
												{label: "Male", value: "male"},
												{label: "Female", value: "female"},
												{label: "Other", value: "other"},
											]}
										/>
										{getError("gender")}
									</div>

									<div>
										<label className="block font-medium mb-1 text-gray-600">Date of birth</label>
										<DatePicker
											className="w-full"
											format="DD MMM YYYY"
											placeholder={`You must be ${DONOR_MIN_AGE}–${DONOR_MAX_AGE} years old`}
											disabledDate={(date) => date.isAfter(dayjs().subtract(DONOR_MIN_AGE, "year"))}
											defaultPickerValue={dayjs().subtract(25, "year")}
											value={formik.values.dob ? dayjs(formik.values.dob) : null}
											onChange={(date) => formik.setFieldValue("dob", date ? date.format("YYYY-MM-DD") : "")}
											onBlur={() => formik.setFieldTouched("dob", true)}
										/>
										{getError("dob")}
									</div>

									<div>
										<label className="block font-medium mb-1 text-gray-600">Blood group</label>
										<Select
											className="w-full"
											placeholder="Select blood group"
											value={formik.values.bloodGroup || undefined}
											onChange={(value) => formik.setFieldValue("bloodGroup", value)}
											onBlur={() => formik.setFieldTouched("bloodGroup", true)}
											options={BLOOD_GROUPS.map((group) => ({label: group, value: group}))}
										/>
										{getError("bloodGroup")}
									</div>

									<div>
										<label className="block font-medium mb-1 text-gray-600">Your area</label>
										<LocationAutoComplete
											onSelectLocation={(selected) => {
												const location = Array.isArray(selected) ? selected[0] : selected;
												formik.setFieldValue("locationName", location?.location ?? "");
												formik.setFieldValue("latitude", location ? Number(location.lat) : undefined);
												formik.setFieldValue("longitude", location ? Number(location.lon) : undefined);
												formik.setFieldValue("city", location?.city ?? null);
												formik.setFieldValue("organisationId", "");
											}}
										/>
										{getError("locationName")}
									</div>

									<div className="md:col-span-2">
										<label className="block font-medium mb-1 text-gray-600">Address</label>
										<TextArea name="address" rows={3} placeholder="House, street, locality, city, PIN" value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} />
										{getError("address")}
									</div>

									<div className="md:col-span-2">
										<label className="block font-medium mb-1 text-gray-600">Photo (optional)</label>
										<DonorPhotoUpload onUploaded={(filekey) => formik.setFieldValue("photo", filekey)} />
									</div>
								</div>

								<div className="mt-8 flex justify-end">
									<Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end" onClick={handleNext}>
										Next: choose an NGO
									</Button>
								</div>
							</Show>

							<Show IF={step === 1}>
								<p className="text-gray-600 mb-4">Pick the NGO you want to donate through. They will verify your details before you become an active donor.</p>

								<NgoPicker latitude={formik.values.latitude} longitude={formik.values.longitude} city={formik.values.city} area={formik.values.locationName} value={formik.values.organisationId} onChange={(id) => formik.setFieldValue("organisationId", id)} />
								{getError("organisationId")}

								<div className="mt-8 flex flex-col-reverse sm:flex-row justify-between gap-3">
									<Button size="large" icon={<ArrowLeftOutlined />} onClick={() => setStep(0)}>
										Back
									</Button>
									<Button type="primary" size="large" htmlType="submit" loading={formik.isSubmitting} disabled={!formik.values.organisationId}>
										Submit to NGO
									</Button>
								</div>
							</Show>
						</form>
					</Show>
				</Card>
			</div>
		</div>
	);
};

export default DonorRegistrationView;
