"use client";

import React from "react";
import {Input, Button, DatePicker, Upload, Select, Divider, UploadProps, message, Card, Row, Col, Form, Typography, Space, Alert} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {useFormik} from "formik";
import dayjs from "dayjs";
import {ngoRegSchema} from "@/validationSchema/NgoSchema";
import axios from "axios";
import {NGO_TYPES} from "@/data/Ngo";
import LocationAutoComplete from "@/components/LocationAutoComplete";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {useRouter} from "next/navigation";

const {Option} = Select;

const Page: React.FC = () => {
	const router = useRouter();
	const formik = useFormik({
		initialValues: {
			name: "",
			type: "",
			regNo: "",
			estDate: null,
			address: "",
			website: "",
			regCertFilename: "",
			regionCovered: [],
			contactName: "",
			designation: "",
			email: "",
			phone: "",
			govtIdFilename: "",
		},
		validationSchema: ngoRegSchema,
		onSubmit: async (values) => {
			try {
				await axios.post(`/api/v1/ngo/registration`, {...values});
				message.success("Registration successfull!");
				formik.resetForm();
				router.push("/ngo/awaiting-approval");
			} catch (error) {
				message.error(getErrorMessage(error));
			}
		},
	});

	const regCertificateUploadProps: UploadProps = {
		name: "file",
		multiple: false,
		showUploadList: true,
		accept: ".jpg,.jpeg,.png,.webp",
		action: "/api/v1/upload-file",
		data: {
			type: "TEMP_NGO_REG_CERTIFICATE",
		},
		onChange(info) {
			const {status, response} = info.file;
			if (status === "done") {
				message.success(`${info.file.name} file uploaded successfully.`);
				if (response?.filekey) {
					formik.setFieldValue("regCertFilename", response.filekey);
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
						type: "TEMP_NGO_REG_CERTIFICATE",
					},
				})
				.then(() => {
					message.success(`${file.name} file removed successfully.`);
					formik.setFieldValue("regCertFilename", "");
				})
				.catch((error) => {
					console.error("Error removing file:", error);
					message.error(`${file.name} file removal failed.`);
				});
		},
	};

	const govtIdUploadProps: UploadProps = {
		name: "file",
		multiple: false,
		showUploadList: true,
		accept: ".jpg,.jpeg,.png,.webp",
		action: "/api/v1/upload-file",
		data: {
			type: "TEMP_NGO_CONTACT_ID_PROOF",
		},
		onChange(info) {
			const {status, response} = info.file;
			if (status === "done") {
				message.success(`${info.file.name} file uploaded successfully.`);
				if (response?.filekey) {
					formik.setFieldValue("govtIdFilename", response.filekey);
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
						type: "TEMP_NGO_CONTACT_ID_PROOF",
					},
				})
				.then(() => {
					message.success(`${file.name} file removed successfully.`);
					formik.setFieldValue("govtIdFilename", "");
				})
				.catch((error) => {
					console.error("Error removing file:", error);
					message.error(`${file.name} file removal failed.`);
				});
		},
	};

	const getError = (field: keyof typeof formik.values) => formik.touched[field] && formik.errors[field];

	return (
		<div className="p-6 flex items-start justify-center">
			<div className="max-w-6xl w-full">
				<div className="mb-6">
					<Typography.Title level={2} className="!mb-0">
						Register your NGO
					</Typography.Title>

					<Space direction="vertical" size={12} className="w-full">
						<Typography.Paragraph className="text-sm text-gray-600"></Typography.Paragraph>

						<Alert
							type="info"
							showIcon
							message={
								<div>
									<div>Documents will remain private and used only for verification.</div>
									<div>Share accurate organisation details and a valid registration certificate. We will review your submission and get back to you.</div>
								</div>
							}
						/>
					</Space>
				</div>

				<Card className="shadow-lg">
					<Form layout="vertical" className="space-y-6" onFinish={formik.handleSubmit}>
						<div className="text-lg font-medium">Organisation Information</div>
						<Divider />

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Organisation Name" help={getError("name") ? (formik.errors.name as string) : undefined} validateStatus={getError("name") ? "error" : undefined}>
									<Input name="name" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.name} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Organisation Type" help={getError("type") ? (formik.errors.type as string) : undefined} validateStatus={getError("type") ? "error" : undefined}>
									<Select className="w-full" placeholder="Select type" onChange={(val) => formik.setFieldValue("type", val)} onBlur={() => formik.setFieldTouched("type", true)} value={formik.values.type}>
										{NGO_TYPES.map((item) => (
											<Option key={item} value={item}>
												{item}
											</Option>
										))}
									</Select>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Registration Number" help={getError("regNo") ? (formik.errors.regNo as string) : undefined} validateStatus={getError("regNo") ? "error" : undefined}>
									<Input name="regNo" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.regNo} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Date of Establishment" help={getError("estDate") ? (formik.errors.estDate as string) : undefined} validateStatus={getError("estDate") ? "error" : undefined}>
									<DatePicker className="w-full" value={formik.values.estDate ? dayjs(formik.values.estDate) : null} onChange={(val) => formik.setFieldValue("estDate", val?.toDate() || null)} onBlur={() => formik.setFieldTouched("estDate", true)} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Office Address" help={getError("address") ? (formik.errors.address as string) : undefined} validateStatus={getError("address") ? "error" : undefined}>
									<Input name="address" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.address} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Website" help={getError("website") ? (formik.errors.website as string) : undefined} validateStatus={getError("website") ? "error" : undefined}>
									<Input name="website" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.website} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Upload Registration Certificate" help={getError("regCertFilename") ? (formik.errors.regCertFilename as string) : undefined} validateStatus={getError("regCertFilename") ? "error" : undefined}>
									<Upload {...regCertificateUploadProps} className="!w-full">
										<Button className="w-full" icon={<UploadOutlined />}>
											Click to Upload
										</Button>
									</Upload>
								</Form.Item>
							</Col>

							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Regions Covered" help={getError("regionCovered") ? (formik.errors.regionCovered as string) : undefined} validateStatus={getError("regionCovered") ? "error" : undefined}>
									<LocationAutoComplete
										multiple={true}
										onSelectLocation={(locationData) => {
											formik.setFieldValue("regionCovered", locationData);
										}}
									/>
								</Form.Item>
							</Col>
						</Row>

						<div className="text-lg font-medium mt-4">Contact Information</div>
						<Divider />

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Contact Name" help={getError("contactName") ? (formik.errors.contactName as string) : undefined} validateStatus={getError("contactName") ? "error" : undefined}>
									<Input name="contactName" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.contactName} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Designation" help={getError("designation") ? (formik.errors.designation as string) : undefined} validateStatus={getError("designation") ? "error" : undefined}>
									<Input name="designation" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.designation} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Email" help={getError("email") ? (formik.errors.email as string) : undefined} validateStatus={getError("email") ? "error" : undefined}>
									<Input name="email" type="email" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.email} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Phone" help={getError("phone") ? (formik.errors.phone as string) : undefined} validateStatus={getError("phone") ? "error" : undefined}>
									<Input name="phone" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.phone} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={[16, 12]}>
							<Col xs={24} md={12} lg={12}>
								<Form.Item label="Upload Government ID" help={getError("govtIdFilename") ? (formik.errors.govtIdFilename as string) : undefined} validateStatus={getError("govtIdFilename") ? "error" : undefined}>
									<Upload {...govtIdUploadProps}>
										<Button icon={<UploadOutlined />}>Click to Upload</Button>
									</Upload>
								</Form.Item>
							</Col>
						</Row>

						<div className="mt-4 flex justify-end gap-3">
							<Button onClick={() => {
                                formik.resetForm();
                                router.push("/");
                            }}>Cancel</Button>
							<Button type="primary" htmlType="submit" loading={formik.isSubmitting}>
								Register
							</Button>
						</div>
					</Form>
				</Card>

				<div className="mt-6">
					<Typography.Text strong>Need help?</Typography.Text>
					<div className="text-sm text-gray-600">Contact support@floatingbloodbank.org for assistance with registration.</div>
				</div>
			</div>
		</div>
	);
};

export default Page;
