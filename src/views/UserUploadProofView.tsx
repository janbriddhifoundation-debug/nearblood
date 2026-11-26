"use client";
import {InboxOutlined} from "@ant-design/icons";
import {Button, Input, message, Select, Typography, Upload} from "antd";
import React, {useEffect, useState} from "react";
const {Title, Text} = Typography;
const {Dragger} = Upload;
const {TextArea} = Input;
import type {UploadFile, UploadProps} from "antd";
import axios from "axios";
import {IBloodRequest} from "@/types/bloodRequestTypes";
import {useRouter} from "next/navigation";

type UploadResponse = {
	success: boolean;
	filekey: string;
	url: string;
};

type CustomUploadFile = UploadFile<UploadResponse>;

const UserUploadProofView = () => {
	const router = useRouter();
	const maxLength = 600;
	const [requests, setRequests] = useState<IBloodRequest[]>([]);
	const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
	const [isloadingRequests, setIsLoadingRequests] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		requestId: undefined,
		feedback: "",
		fileNames: [] as string[],
	});

	const draggerProps: UploadProps = {
		name: "file",
		multiple: true,
		maxCount: 5,
		showUploadList: true,
		accept: ".jpg,.jpeg,.png,.webp",
		action: "/api/v1/upload-file",
		fileList,
		data: {
			type: "TEMP_BLOOD_DONATION_PROOF",
		},
		onChange(info) {
			const {status, response} = info.file;
			setFileList(info.fileList); // Keep the file list in sync

			if (status === "done") {
				message.success(`${info.file.name} file uploaded successfully.`);
				if (response?.filekey) {
					setFormData((prev) => ({
						...prev,
						fileNames: [...prev.fileNames, response.filekey],
					}));
				}
			} else if (status === "error") {
				message.error(`${info.file.name} file upload failed.`);
			}
		},
		onRemove(file) {
			const filekey = file.response?.filekey;
			if (filekey) {
				setFormData((prev) => ({
					...prev,
					fileNames: prev.fileNames.filter((key) => key !== filekey),
				}));
			}
			axios
				.delete(`/api/v1/delete-upload`, {
					data: {
						filekey,
						type: "TEMP_BLOOD_DONATION_PROOF",
					},
				})
				.then(() => {
					message.success(`${file.name} file removed successfully.`);
					setFileList((prevList) => prevList.filter((f) => f.uid !== file.uid));
				})
				.catch((error) => {
					console.error("Error removing file:", error);
					message.error(`${file.name} file removal failed.`);
				});
		},
	};

	const fetchRequests = async () => {
		try {
			setIsLoadingRequests(true);
			const {data} = await axios.get(`/api/v1/user/requests?status=open`);
			setRequests(data.requests || []);
		} catch (error) {
			console.error("Error fetching requests:", error);
		} finally {
			setIsLoadingRequests(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.requestId) {
			message.error("Please select a request.");
			return;
		}
		if (formData.fileNames.length === 0) {
			message.error("Please upload at least one file.");
			return;
		}
		try {
			setIsSubmitting(true);
			const res = await axios.post("/api/v1/user/requests/submit-proof", {
				...formData,
			});
			console.log(res.data);
			message.success("Proof submitted successfully.");
			setFormData({
				requestId: undefined,
				feedback: "",
				fileNames: [],
			});
			setFileList([]);
			router.push("/user/support-initiative");
		} catch (error) {
			console.error("Error submitting proof:", error);
			message.error("Failed to submit proof. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// -----------------------------------
	useEffect(() => {
		fetchRequests();
	}, []);
	//------------------------------------

	if (isloadingRequests) {
		return (
			<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
				<h2>Loading...</h2>
			</div>
		);
	}

	return (
		<>
			<div style={{background: "#fff", padding: 24, maxWidth: "1380px", margin: "0 auto"}}>
				<div className="mb-12">
					<h1 className="text-[#383435] text-xl font-semibold">Blood Donation Proof</h1>
					<h3 className="text-black/45">Please Upload a Proof of Donation</h3>
				</div>

				<form onSubmit={handleSubmit}>
					<Select
						placeholder="Select a request"
						optionFilterProp="label"
						onChange={(value) => {
							setFormData((prev) => ({
								...prev,
								requestId: value,
							}));
						}}
						value={formData.requestId}
						loading={isloadingRequests}
						style={{width: 400}}
						size="large"
						options={requests?.map((item) => {
							return {
								value: item.id,
								label: (
									<div style={{display: "flex", gap: 16, alignItems: "center"}}>
										<div style={{width: "120px"}}>#{item.id}</div>
										<div style={{flex: 1, display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between"}}>
											<div>{item.patientName}</div>
											<div>{item.hospital}</div>
										</div>
									</div>
								),
							};
						})}
					/>

					<Dragger {...draggerProps} style={{marginTop: 16}}>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">Click or drag file to this area to upload</p>
						<p className="ant-upload-hint">Support for a single or bulk upload.</p>
					</Dragger>

					<div
						style={{
							marginTop: 48,
						}}>
						<Title level={3} style={{marginBottom: 0}}>
							Your Feedback is Important!
						</Title>
						<Text strong style={{color: "#555", display: "block", marginBottom: 16}}>
							Please let us know how your experience was.
						</Text>

						<TextArea
							rows={5}
							placeholder="Max Mustermann"
							style={{marginBottom: 4}}
							value={formData.feedback}
							onChange={(e) => {
								setFormData((prev) => ({
									...prev,
									feedback: e.target.value,
								}));
							}}
						/>

						<div style={{marginBottom: 16}}>
							<Text type="secondary">{maxLength - formData.feedback.length} characters remaining</Text>
						</div>

						<div style={{textAlign: "left"}}>
							<Button type="primary" loading={isSubmitting} htmlType="submit" danger size="large">
								Submit and close Request
							</Button>
						</div>
					</div>
				</form>
			</div>
		</>
	);
};

export default UserUploadProofView;
