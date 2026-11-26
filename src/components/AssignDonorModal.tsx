import {Modal, Input, Select, Button, Checkbox, CheckboxProps, Avatar, Card, Divider, Typography, message, Spin} from "antd";
import React, {useEffect} from "react";
import {debounce} from "lodash";
import {UserOutlined} from "@ant-design/icons";
import {getErrorMessage} from "@/utils/getErrorMessage";
import axios from "axios";
import {BLOOD_GROUPS} from "@/data/Others";
import Show from "./Show";
const {Text} = Typography;

const options = BLOOD_GROUPS.map((bg) => ({label: bg, value: bg}));

type Donor = {
	id: number;
	photo?: string | null;
	name?: string;
	bloodGroup?: string;
	phone?: string;
	address?: string;
};

type AssignDonorModalProps = {
	requestData?: { id?: string | number; patientName?: string; bloodGroup?: string; units?: number } | null;
	isModalOpen: boolean;
	handleCancel: () => void;
};

const AssignDonorModal: React.FC<AssignDonorModalProps> = ({requestData, isModalOpen, handleCancel}) => {
	const [selectedBloodGroups, setSelectedBloodGroups] = React.useState<string[]>([]);
	const [selectedDonors, setSelectedDonors] = React.useState<number[]>([]);
	const [searchTerm, setSearchTerm] = React.useState<string>("");
	const [loading, setLoading] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);

	const [donors, setDonors] = React.useState<Donor[]>([]);

	// Debounced search setter
	const debouncedSetSearchTerm = React.useMemo(() => debounce(setSearchTerm, 500), []);

	const handleBloodGroupSelect = (value: string[]) => {
		setSelectedBloodGroups(value);
	};

	const handleCheckboxChange: CheckboxProps["onChange"] = (e) => {
		const donorId = e.target.value;
		setSelectedDonors((prev) => {
			if (e.target.checked) {
				return [...prev, donorId];
			} else {
				return prev.filter((id) => id !== donorId);
			}
		});
	};

	const fetchDonors = React.useCallback(async () => {
		try {
			setLoading(true);
			const payload = {
				bloodGroups: selectedBloodGroups?.join(",") || [],
				searchTerm: searchTerm,
			};
			const {data} = await axios.get("/api/v1/ngo/donors", {params: payload});
			setDonors(data?.donors || []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [selectedBloodGroups, searchTerm]);

	const handleSubmit = async () => {
		try {
			setSubmitting(true);
			await axios.post("/api/v1/ngo/assign-donors", {
				donorIds: selectedDonors,
				requestId: requestData?.id,
			});
			message.success("Donor assigned successfully");
			handleCancel();
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		fetchDonors();
	}, [selectedBloodGroups, searchTerm, fetchDonors]);

	return (
		<Modal title={<Text type="secondary">{requestData?.id || ""}</Text>} open={isModalOpen} onCancel={handleCancel} footer={null} width={800}>
			<Card variant="outlined" className="!my-6 !bg-red-50 !border-none">
				<div className="flex justify-between items-center font-semibold">
					<div>
						<span className="text-gray-500">Patient Name:</span> {requestData?.patientName}
					</div>
					<div>
						<span className="text-gray-500">Blood Group:</span> {requestData?.bloodGroup}
					</div>
					<div>
						<span className="text-gray-500">Units Required:</span> {requestData?.units}
					</div>
				</div>
			</Card>
			<div className="flex gap-4 mb-10">
				<Input placeholder="Search donor" className="w-56 rounded-lg" allowClear defaultValue={searchTerm} onChange={(e) => debouncedSetSearchTerm(e.target.value)} />
				<Select mode="multiple" className="w-56" placeholder="Blood type" onChange={handleBloodGroupSelect} options={options} />
				<Button type="primary" className="rounded-lg min-w-[100px] font-semibold" onClick={handleSubmit} loading={submitting}>
					Submit
				</Button>
			</div>
			<Divider orientation="left" className="my-6">
				Available Donors
			</Divider>
			<div className="overflow-x-auto">
				<Show IF={loading}>
					<div className="flex flex-col gap-3 justify-center min-h-[100px] items-center">
						<Spin />
						<div>Loading...</div>
					</div>
				</Show>
				<Show IF={!loading && !!!donors.length}>
					<div className="py-4 text-center text-gray-500">No donors found</div>
				</Show>
				<Show IF={!loading && !!donors.length}>
					<table className="min-w-full">
						<thead>
							<tr className="!bg-gray-50 text-gray-700">
								<th className="px-4 py-2 text-left font-normal"></th>
								<th className="px-4 py-2 text-left font-normal">Donor</th>
								<th className="px-4 py-2 text-left font-normal whitespace-nowrap">Blood Group</th>
								<th className="px-4 py-2 text-left font-normal">Phone</th>
								<th className="px-4 py-2 text-left font-normal">Address</th>
							</tr>
						</thead>
						<tbody>
							{donors.map((donor, idx) => (
								<tr key={idx} className="border-b border-gray-100 last:border-b-0 hover:bg-red-50 transition">
									<td className="pl-4 py-3">
										<Checkbox value={donor.id} checked={selectedDonors.includes(donor.id)} onChange={handleCheckboxChange} />
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<Avatar size={32} icon={<UserOutlined />} src={donor.photo} />
											<span className="font-medium  text-xs whitespace-nowrap">{donor.name}</span>
										</div>
									</td>
									<td className="px-4 py-3">
										<span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">{donor.bloodGroup}</span>
									</td>
									<td className="px-4 py-3">
										<span className="inline-block text-xs font-medium">{donor.phone}</span>
									</td>
									<td className="px-4 py-3 ">
										<div className="max-w-[300px] flex items-center">
											<span className="text-xs font-medium truncate">{donor.address}</span>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</Show>
			</div>
		</Modal>
	);
};

export default AssignDonorModal;
