"use client";

import React, {useState} from "react";
import {Input, Button, DatePicker, Upload, Select, Divider, UploadProps, message, UploadFile} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {useFormik} from "formik";
import dayjs from "dayjs";
import {donorRegSchema} from "@/validationSchema/NgoSchema";
import axios from "axios";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {BLOOD_GROUPS} from "@/data/Others";
import {useRouter} from "next/navigation";

const {Option} = Select;
const {TextArea} = Input;

const Page: React.FC = () => {
	const router = useRouter();
	const [fileList, setFileList] = useState<UploadFile[]>([]);

	const formik = useFormik({
		initialValues: {
			name: "",
			gender: "",
			email: "",
			phone: "",
			dob: "",
			bloodGroup: "",
			address: "",
			photo: "",
		},
		validationSchema: donorRegSchema,
		onSubmit: async (values) => {
			try {
				await axios.post(`/api/v1/ngo/donors`, {...values});
				message.success("Registration successful!");
				formik.resetForm();
				setFileList([]);
			} catch (error) {
				message.error(getErrorMessage(error));
			}
		},
	});

	const photoUploadProps: UploadProps = {
		name: "file",
		multiple: false,
		showUploadList: true,
		accept: ".jpg,.jpeg,.png,.webp",
		action: "/api/v1/upload-file",
		data: {type: "TEMP_DONOR_PHOTO"},
		fileList,
		onChange(info) {
			const {status, response} = info.file;
			setFileList(info.fileList);
			if (status === "done") {
				message.success(`${info.file.name} file uploaded successfully.`);
				if (response?.filekey) {
					formik.setFieldValue("photo", response.filekey);
				}
			} else if (status === "error") {
				message.error(`${info.file.name} file upload failed.`);
			}
		},
		onRemove(file) {
			const filekey = file.response?.filekey;
			axios
				.delete(`/api/v1/delete-upload`, {
					data: {
						filekey,
						type: "TEMP_DONOR_PHOTO",
					},
				})
				.then(() => {
					message.success(`${file.name} file removed successfully.`);
					formik.setFieldValue("photo", "");
					setFileList([]);
				})
				.catch((error) => {
					console.error("Error removing file:", error);
					message.error(`${file.name} file removal failed.`);
				});
		},
	};

	const getError = (field: keyof typeof formik.values) => formik.touched[field] && formik.errors[field];

	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<div className="px-8 py-6 bg-white rounded-lg shadow">
				<h2 className="text-2xl font-bold">Add a new Donor</h2>
				<p>Register new donors with Floating Blood Bank and strengthen your impact.</p>

				<form onSubmit={formik.handleSubmit} className="space-y-6">
					<div className="text-xl mt-8">Contact Information</div>
					<Divider />

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block font-medium mb-1 text-gray-600">Name</label>
							<Input name="name" placeholder="Enter full name" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.name} />
							{getError("name") && <div className="text-red-500 text-xs py-2">{formik.errors.name}</div>}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Gender</label>
							<Select className="w-full" value={formik.values.gender || undefined} onChange={(value) => formik.setFieldValue("gender", value)} onBlur={() => formik.setFieldTouched("gender", true)} placeholder="Select gender">
								<Option value="male">Male</Option>
								<Option value="female">Female</Option>
								<Option value="other">Other</Option>
							</Select>
							{getError("gender") && <div className="text-red-500 text-xs py-2">{formik.errors.gender}</div>}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Email</label>
							<Input name="email" type="email" placeholder="Enter email address" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.email} />
							{getError("email") && <div className="text-red-500 text-xs py-2">{formik.errors.email}</div>}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Phone</label>
							<Input name="phone" placeholder="Enter phone number" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.phone} />
							{getError("phone") && <div className="text-red-500 text-xs py-2">{formik.errors.phone}</div>}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">DOB</label>
							<DatePicker style={{width: "100%"}} value={formik.values.dob ? dayjs(formik.values.dob) : null} onChange={(date, dateString) => formik.setFieldValue("dob", dateString)} onBlur={() => formik.setFieldTouched("dob", true)} placeholder="Select date of birth" />
							{getError("dob") && <div className="text-red-500 text-xs py-2">{formik.errors.dob}</div>}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Blood Group</label>
							<Select className="w-full" value={formik.values.bloodGroup || undefined} onChange={(value) => formik.setFieldValue("bloodGroup", value)} onBlur={() => formik.setFieldTouched("bloodGroup", true)} placeholder="Select blood group">
								{BLOOD_GROUPS.map((group) => (
									<Option key={group} value={group}>
										{group}
									</Option>
								))}
							</Select>
							{getError("bloodGroup") && <div className="text-red-500 text-xs py-2">{formik.errors.bloodGroup}</div>}
						</div>

						<div className="md:col-span-2">
							<label className="block font-medium mb-1 text-gray-600">Address</label>
							<TextArea name="address" rows={3} placeholder="Enter full address" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.address} />
							{getError("address") && <div className="text-red-500 text-xs py-2">{formik.errors.address}</div>}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Photo</label>
							<Upload {...photoUploadProps}>
								<Button icon={<UploadOutlined />}>Click to Upload</Button>
							</Upload>
							{getError("photo") && <div className="text-red-500 text-xs py-2">{formik.errors.photo}</div>}
						</div>
					</div>

					<div className="mt-6 flex justify-end gap-4">
						<Button
							onClick={() => {
								router.push("/ngo/donors");
							}}>
							Cancel
						</Button>
						<Button type="primary" htmlType="submit" loading={formik.isSubmitting}>
							Register
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Page;
