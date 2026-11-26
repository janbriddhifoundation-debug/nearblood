"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import {useFormik} from "formik";
import {Button, Card, Descriptions, Input, Spin, Switch, Tag, message} from "antd";
import {EnvironmentOutlined} from "@ant-design/icons";
import LocationAutoComplete from "@/components/LocationAutoComplete";
import DonorPhotoUpload from "@/components/Donor/DonorPhotoUpload";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {showValidationErrors} from "@/utils/showValidationErrors";
import {zodFormikValidate} from "@/utils/zodFormikValidate";
import {donorProfileUpdateSchema, TDonorProfileUpdate} from "@/validationSchema/donorSchema";
import {IDonorMe} from "@/types/donorTypes";

const {TextArea} = Input;

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [me, setMe] = useState<IDonorMe | null>(null);

	const formik = useFormik<TDonorProfileUpdate>({
		initialValues: {phone: "", address: "", photo: null, isAvailable: true, locationName: "", latitude: 0, longitude: 0},
		validate: zodFormikValidate<TDonorProfileUpdate>(donorProfileUpdateSchema),
		onSubmit: async (values) => {
			try {
				await axios.patch("/api/v1/donor/me", values);
				message.success("Profile updated");
			} catch (error) {
				showValidationErrors(error);
			}
		},
	});

	const fetchProfile = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/donor/me");
			setMe(data);
			formik.resetForm({
				values: {
					phone: data.donor.phone ?? "",
					address: data.donor.address ?? "",
					photo: null,
					isAvailable: data.donor.isAvailable,
					locationName: data.donor.locationName ?? "",
					latitude: data.donor.latitude ?? 0,
					longitude: data.donor.longitude ?? 0,
				},
			});
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		void fetchProfile();
	}, [fetchProfile]);

	const getError = (field: keyof TDonorProfileUpdate) => (formik.touched[field] && formik.errors[field] ? <div className="text-red-500 text-xs py-1">{formik.errors[field]}</div> : null);

	if (loading || !me) {
		return (
			<div className="h-[70vh] flex items-center justify-center">
				<Spin size="large" spinning={loading} />
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8 max-w-[1100px] mx-auto">
			<div className="text-2xl font-semibold mb-2">Profile</div>
			<div className="text-sm text-gray-600 mb-8">Keep your contact details and area up to date so your NGO can reach you.</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="!rounded-xl lg:col-span-1" title="Donor details">
					<Descriptions column={1} size="small">
						<Descriptions.Item label="Name">{me.donor.name}</Descriptions.Item>
						<Descriptions.Item label="Email">{me.donor.email}</Descriptions.Item>
						<Descriptions.Item label="Blood group">
							<Tag color="red">{me.donor.bloodGroup}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Date of birth">{me.donor.dob ? dayjs(me.donor.dob).format("DD MMM YYYY") : "-"}</Descriptions.Item>
						<Descriptions.Item label="Gender">
							<span className="capitalize">{me.donor.gender ?? "-"}</span>
						</Descriptions.Item>
						<Descriptions.Item label="NGO">{me.organisation?.name ?? "-"}</Descriptions.Item>
					</Descriptions>
					<p className="text-xs text-gray-500 mt-4">To correct your name, blood group or date of birth, please contact your NGO.</p>
				</Card>

				<Card className="!rounded-xl lg:col-span-2" title="Contact & availability">
					<form onSubmit={formik.handleSubmit} className="space-y-5">
						<div>
							<label className="block font-medium mb-2 text-gray-600">Photo</label>
							<DonorPhotoUpload currentUrl={me.donor.photoUrl} onUploaded={(filekey) => formik.setFieldValue("photo", filekey)} />
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Phone</label>
							<Input name="phone" addonBefore="+91" maxLength={10} value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} className="max-w-xs" />
							{getError("phone")}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Your area</label>
							<div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
								<EnvironmentOutlined className="!text-red-500" />
								{formik.values.locationName || "Not set"}
							</div>
							<LocationAutoComplete
								onSelectLocation={(selected) => {
									const location = Array.isArray(selected) ? selected[0] : selected;
									if (!location) return;
									formik.setFieldValue("locationName", location.location);
									formik.setFieldValue("latitude", Number(location.lat));
									formik.setFieldValue("longitude", Number(location.lon));
								}}
							/>
							{getError("locationName")}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Address</label>
							<TextArea name="address" rows={3} value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} />
							{getError("address")}
						</div>

						<div className="flex items-center gap-3">
							<Switch checked={formik.values.isAvailable} onChange={(checked) => formik.setFieldValue("isAvailable", checked)} aria-label="Available to donate" />
							<span>Available to donate</span>
						</div>

						<div className="flex justify-end">
							<Button type="primary" htmlType="submit" loading={formik.isSubmitting} disabled={!formik.dirty}>
								Save changes
							</Button>
						</div>
					</form>
				</Card>
			</div>
		</div>
	);
};

export default Page;
