import {Avatar, Divider, Modal} from "antd";
import React from "react";
import dayjs from "dayjs";
import Show from "./Show";
import {UserOutlined} from "@ant-design/icons";

type Donor = {
	photo?: string | null;
	name?: string;
	bloodGroup?: string;
	phone?: string;
	address?: string;
};

type RequestDetailsModalProps = {
	data?: {
		id?: string | number;
		patientName?: string;
		age?: number;
		gender?: string;
		patientAddress?: string;
		bloodGroup?: string;
		units?: number;
		urgency?: string;
		relWRequester?: string;
		notes?: string;
		hospital?: string;
		hospitalRegNo?: string;
		locationName?: string;
		reason?: string;
		requirementDate?: string;
		createdAt?: string;
		contact?: string;
		donors?: Donor[];
	} | null;
	isModalOpen: boolean;
	handleCancel: () => void;
};

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({data, isModalOpen, handleCancel}) => {
	const urgencyColor = {
		high: "text-red-500",
		medium: "text-yellow-400",
		low: "text-green-500",
	};

	return (
		<Modal title={`${data?.id}`} footer={null} closable open={isModalOpen} onCancel={handleCancel} width={800}>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 !pt-10 mb-10">
				<div className="space-y-2">
					<div>
						<span className="text-gray-500">Patient Name:</span> <span className="ml-2 text-gray-400">{data?.patientName}</span>
					</div>
					<div>
						<span className="text-gray-500">Age:</span> <span className="ml-2 text-gray-400">{data?.age}</span>
					</div>
					<div>
						<span className="text-gray-500">Gender:</span> <span className="ml-2 text-gray-400">{data?.gender}</span>
					</div>
					<div>
						<span className="text-gray-500">Address:</span> <span className="ml-2 text-gray-400">{data?.patientAddress}</span>
					</div>
					<div>
						<span className="text-gray-500">Blood Group:</span>
						<span className="ml-2 text-red-700 font-semibold">{data?.bloodGroup}</span>
					</div>
					<div>
						<span className="text-gray-500">Units Needed:</span>
						<span className="ml-2 text-blue-700 font-semibold">{data?.units}</span>
					</div>
					<div>
						<span className="text-gray-500">Urgency:</span>
						<span className={`ml-2 font-semibold text-gray-400 ${urgencyColor[(data?.urgency as keyof typeof urgencyColor) ?? 'low']}`}>{data?.urgency}</span>
					</div>
					<div>
						<span className="text-gray-500">Relation:</span>
						<span className="ml-2 text-blue-700 font-semibold">{data?.relWRequester}</span>
					</div>
					<Show IF={!!data?.notes}>
						<div>
							<span className="text-gray-500">Notes:</span>
							<span className="ml-2 text-gray-400">{data?.notes}</span>
						</div>
					</Show>
				</div>

				<div className="space-y-2">
					<div>
						<span className="text-gray-500">Hospital:</span> <span className="ml-2 text-gray-400">{data?.hospital}</span>
					</div>
					<div>
						<span className="text-gray-500">Reg. No:</span> <span className="ml-2 text-gray-400">{data?.hospitalRegNo}</span>
					</div>
					<div>
						<span className="text-gray-500">Location:</span> <span className="ml-2 text-gray-400">{data?.locationName}</span>
					</div>
					<div>
						<span className="text-gray-500">Reason:</span> <span className="ml-2 text-gray-400">{data?.reason}</span>
					</div>
					<div>
						<span className="text-gray-500">Requirement Date:</span>
						<span className="ml-2 text-gray-400">{data?.requirementDate ? new Date(data.requirementDate).toLocaleDateString() : "-"}</span>
					</div>
					<div>
						<span className="text-gray-500">Created At:</span>
						<span className="ml-2 text-gray-400">{data?.createdAt ? dayjs(data.createdAt).format("D MMMM, YYYY h:mm A") : "-"}</span>
					</div>
					<div>
						<span className="text-gray-500">Contact:</span>
						<span className="ml-2 text-gray-400">{data?.contact}</span>
					</div>
				</div>
			</div>

			<Divider orientation="left" className="py-6">
				Assigned Donors
			</Divider>

			<div className="min-w-full overflow-x-auto pb-2">
				<table className="min-w-full">
					<thead>
						<tr className="!bg-gray-50 text-gray-700">
							<th className="px-4 py-2 text-left font-normal">Donor</th>
							<th className="px-4 py-2 text-left font-normal whitespace-nowrap">Blood Group</th>
							<th className="px-4 py-2 text-left font-normal">Phone</th>
							<th className="px-4 py-2 text-left font-normal">Address</th>
						</tr>
					</thead>
					<tbody>
						{data?.donors?.map((donor, idx) => (
							<tr key={idx} className="border-b border-gray-100 last:border-b-0 ">
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
			</div>
		</Modal>
	);
};

export default RequestDetailsModal;
