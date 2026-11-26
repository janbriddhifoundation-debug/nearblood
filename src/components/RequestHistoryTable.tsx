"use client";
import React from "react";
import {Button, Table, Tag} from "antd";
import {useRouter} from "next/navigation";
import {IBloodRequest} from "@/types/bloodRequestTypes";
import {CaretRightOutlined} from "@ant-design/icons";

interface RequestHistoryTableProps {
	requests: IBloodRequest[];
	loading: boolean;
}

const RequestHistoryTable: React.FC<RequestHistoryTableProps> = ({requests, loading}) => {
	const router = useRouter();

	const getUrgencyStyles = (urgency: string) => {
		switch (urgency?.toLowerCase()) {
			case "high":
				return "bg-red-100 text-red-700";
			case "medium":
				return "bg-yellow-100 text-yellow-700";
			case "low":
			default:
				return "bg-green-100 text-green-700";
		}
	};

	const getStatusStyles = (status: string | undefined) => {
		switch (status) {
			case "DONORS_ASSIGNED":
				return "text-green-600";
			case "REQUEST_CLOSED":
				return "text-orange-500";
			case "REQUEST_SENT":
			default:
				return "text-gray-600";
		}
	};

	const getStatusText = (status: string | undefined) => {
		switch (status) {
			case "REQUEST_SENT":
				return "Request Sent";
			case "DONORS_ASSIGNED":
				return "Donors Assigned";
			case "REQUEST_CLOSED":
				return "Request Closed";
			default:
				return "Unknown";
		}
	};

	const columns = [
		{
			title: "Request ID",
			dataIndex: "id",
			key: "id",
			render: (id: string) => <>#{id}</>,
		},
		{
			title: "Patient Name",
			dataIndex: "patientName",
			key: "patientName",
		},
		{
			title: "Units Required",
			dataIndex: "units",
			key: "units",
		},
		{
			title: "Urgency Level",
			key: "urgency",
			dataIndex: "urgency",
			render: (urgency: string) => {
				let color = "default";
				switch (urgency.toLowerCase()) {
					case "high":
						color = "red";
						break;
					case "medium":
						color = "orange";
						break;
					case "low":
						color = "green";
						break;
				}
				return <Tag color={color}>{urgency.toUpperCase()}</Tag>;
			},
		},
		{
			title: "Hospital Name",
			key: "hospital",
			dataIndex: "hospital",
		},
		{
			title: "Status",
			key: "status",
			dataIndex: "status",
			render: (status: string) => {
				let color = "";
				let text = "-";
				switch (status) {
					case "REQUEST_SENT":
						color = "text-gray-500";
						text = "Request Sent";
						break;
					case "DONORS_ASSIGNED":
						color = "text-green-600";
						text = "Donors Assigned";
						break;
					case "REQUEST_CLOSED":
						color = "text-orange-500";
						text = "Request Closed";
						break;
					default:
						color = "text-gray-400";
						text = "Unknown";
				}
				return <span className={color}>{text}</span>;
			},
		},
		{
			title: "Actions",
			key: "actions",
			dataIndex: "id",
			render: (id: string) => (
				<Button
					type="link"
					icon={<CaretRightOutlined />}
					onClick={(e) => {
						e.stopPropagation();
						router.push(`/user/request/${id}`);
					}}>
					View Details
				</Button>
			),
		},
	];

	return (
		<>
			{/* desktop view */}
			<div className="hidden lg:block w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
				<div className="min-w-[700px] lg:min-w-full">
					<Table rowKey="id" columns={columns} dataSource={requests} loading={loading} bordered pagination={requests.length > 10 ? {pageSize: 10} : false} className="text-sm lg:text-base" />
				</div>
			</div>

			{/* mobile view */}
			<div className="lg:hidden space-y-4 mt-4">
				{requests?.map((item) => {
					return (
						<div key={item.id} className="border border-gray-200 shadow-sm rounded-xl p-4 bg-white">
							<div className="flex justify-between items-center mb-3">
								<div>
									<p className="text-sm font-semibold text-gray-600">Request ID</p>
									<p className="font-bold text-gray-900">#{item.id}</p>
								</div>

								<span className={`px-3 py-1 text-xs rounded-full font-semibold ${getUrgencyStyles(item.urgency)}`}>{item.urgency?.toUpperCase()}</span>
							</div>

							<div className="border-b my-3"></div>

							<div className="grid grid-cols-2 gap-y-3">
								<div>
									<p className="text-sm text-gray-500">Patient Name</p>
									<p className="font-medium text-gray-800">{item.patientName}</p>
								</div>

								<div>
									<p className="text-sm text-gray-500">Units Required</p>
									<p className="font-medium text-gray-800">{item.units}</p>
								</div>

								<div>
									<p className="text-sm text-gray-500">Hospital Name</p>
									<p className="font-medium text-gray-800">{item.hospital}</p>
								</div>

								<div>
									<p className="text-sm text-gray-500">Status</p>
									<p className={`font-medium ${getStatusStyles(item.status)}`}>{getStatusText(item.status)}</p>
								</div>
							</div>

							<button className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition" onClick={() => router.push(`/user/request/${item.id}`)}>
								View Details <CaretRightOutlined />
							</button>
						</div>
					);
				})}
			</div>
		</>
	);
};

export default RequestHistoryTable;
