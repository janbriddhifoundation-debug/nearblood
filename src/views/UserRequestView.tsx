"use client";

import React, {useState} from "react";
import styled from "styled-components";
import {Form, Input, Button, Select, DatePicker, TimePicker, Row, Col, Typography} from "antd";
import {Droplets} from "@/components/Icons";
import ApprovalWaitingModal from "@/components/ApprovalWaitingModal";
import LocationAutoComplete from "@/components/LocationAutoComplete";
import axios from "axios";
import showValidationErrors from "@/utils/showValidationErrors";
import {useRouter} from "next/navigation";

const {Option} = Select;
const {TextArea} = Input;
const {Title} = Typography;

const StyledForm = styled(Form)`
	.ant-form-item-explain-error {
		font-size: 13px;
	}
`;

interface LocationData {
	location: string;
	lat: string;
	lon: string;
}

const UserRequestView = () => {
	const router = useRouter();
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [requestId, setRequestId] = useState<string | number | null>(null);

	interface FormValues {
		patientName: string;
		age: string | number;
		gender: string;
		patientAddress?: string;
		relWRequester?: string;
		hospitalRegNo?: string;
		bloodGroup: string;
		units: number;
		urgency: string;
		reason: string;
		hospital: string;
		locationName: string;
		latitude?: string;
		longitude?: string;
		requirementDate?: string;
		requirementTime?: string;
		contact: string;
		notes?: string;
	}

	const onFinish = async (values: unknown) => {
		const v = values as FormValues;
		setSubmitting(true);
		try {
			const {data} = await axios.post("/api/v1/user/requests", {...v, age: Number(v.age), latitude: Number(v.latitude as unknown as string), longitude: Number(v.longitude as unknown as string)});
			setRequestId(data.request.id);
			form.resetFields();
			setIsModalVisible(true);
		} catch (error) {
			console.error("Errr----", error);
			showValidationErrors(error as unknown);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<div style={{background: "#fff", padding: 24}}>
				<div className="mb-12">
					<h1 className="text-[#383435] flex items-center text-xl font-semibold">
						<Droplets className="w-8 h-8 mr-2 -ml-2 -mb-1" stroke="red" />
						<span>
							You need <span className="text-red-600 ml-1">blood</span> urgently?
						</span>
					</h1>
					<h3 className="text-black/45 ml-[34px]">We are with you!</h3>
				</div>

				<Title level={4}>Patient Information</Title>
				<hr
					style={{
						height: "1px",
						backgroundColor: "#d9d9d9",
						border: "none",
						marginBottom: "24px",
						marginTop: "8px",
					}}
				/>

				<StyledForm form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
					<Row gutter={16}>
						<Col span={8}>
							<Form.Item
								name="patientName"
								label={
									<span>
										Patient Name<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true, message: "Please enter patient name"}]}>
								<Input placeholder="Patient Full Name" />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="age"
								label={
									<span>
										Age<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[
									{required: true, message: "Please enter age"},
									{pattern: /^[0-9]+$/, message: "Age must be a number"},
								]}>
								<Input placeholder="Age" type="number" />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="gender"
								label={
									<span>
										Gender<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true, message: "Please select gender"}]}>
								<Select placeholder="Select Gender">
									<Option value="male">Male</Option>
									<Option value="female">Female</Option>
									<Option value="other">Other</Option>
								</Select>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={8}>
							<Form.Item name="patientAddress" label="Patient Address">
								<Input placeholder="Address" />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item name="relWRequester" label="Relation with Requester">
								<Input placeholder="e.g. Father, Friend, Self" />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item name="hospitalRegNo" label="Patient Registration No.">
								<Input placeholder="Patient Reg no" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16} style={{marginTop: "24px"}}>
						<Col span={8}>
							<Form.Item
								name="bloodGroup"
								label={
									<span>
										Blood Group<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<Select placeholder="Blood Group">
									<Option value="A+">A+</Option>
									<Option value="A-">A-</Option>
									<Option value="B+">B+</Option>
									<Option value="B-">B-</Option>
									<Option value="O+">O+</Option>
									<Option value="O-">O-</Option>
									<Option value="AB+">AB+</Option>
									<Option value="AB-">AB-</Option>
								</Select>
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="units"
								label={
									<span>
										Units Required<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<Select placeholder="Units Required">
									{Array.from({length: 10}, (_, i) => (
										<Option key={i + 1} value={i + 1}>
											{i + 1}
										</Option>
									))}
								</Select>
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="urgency"
								label={
									<span>
										Urgency Level<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<Select placeholder="Urgency Level">
									<Option value="low">Low</Option>
									<Option value="medium">Medium</Option>
									<Option value="high">High</Option>
								</Select>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={8}>
							<Form.Item
								name="reason"
								label={
									<span>
										Request Reason<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<Select placeholder="Request Reason">
									<Option value="surgery">Surgery</Option>
									<Option value="accident">Accident</Option>
									<Option value="disease">Medical Condition</Option>
								</Select>
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="hospital"
								label={
									<span>
										Hospital Name<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<Input placeholder="Hospital Name" />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="locationName"
								label={
									<span>
										Location<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<LocationAutoComplete
									onSelectLocation={(locationData: LocationData | LocationData[]) => {
										const location = Array.isArray(locationData) ? locationData[0] : locationData;
										if (!location) return;
										form.setFieldsValue({
											locationName: location?.location,
											latitude: location?.lat,
											longitude: location?.lon,
										});
									}}
								/>
							</Form.Item>

							<Form.Item name="latitude" hidden>
								<Input type="hidden" />
							</Form.Item>

							<Form.Item name="longitude" hidden>
								<Input type="hidden" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={8}>
							<Form.Item
								name="requirementDate"
								label={
									<span>
										Date of Requirement<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<DatePicker style={{width: "100%"}} />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="requirementTime"
								label={
									<span>
										Time of Requirement<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<TimePicker use12Hours format="h:mm A" style={{width: "100%"}} />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="contact"
								label={
									<span>
										Contact number<span style={{color: "red", marginLeft: 4}}>*</span>
									</span>
								}
								rules={[{required: true}]}>
								<Input placeholder="Contact number" />
							</Form.Item>
						</Col>
					</Row>

					<Form.Item name="notes" label="Notes (optional)">
						<TextArea rows={4} placeholder="Write anything we need to know" />
					</Form.Item>

					<Form.Item style={{textAlign: "right"}}>
						<Button disabled={submitting} loading={submitting} type="primary" htmlType="submit" style={{background: "#d72638"}}>
							Send My Request
						</Button>
					</Form.Item>
				</StyledForm>
			</div>
			<ApprovalWaitingModal open={isModalVisible} onCancel={() => setIsModalVisible(false)} onSeeOverview={() => router.push(`/user/request/${requestId}`)} />
		</>
	);
};

export default UserRequestView;
