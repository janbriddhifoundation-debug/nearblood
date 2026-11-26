"use client";

import React from "react";
import dayjs from "dayjs";
import {Avatar, Button, Popconfirm, Space, Table, Tag} from "antd";
import type {ColumnsType} from "antd/es/table";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";

export interface NgoDonorRecord {
	id: string;
	photo: string | null;
	name: string;
	gender: string | null;
	bloodGroup: string;
	dob: string;
	phone: string;
	email: string | null;
	address: string;
	locationName: string | null;
	status: "PENDING" | "APPROVED" | "REJECTED";
	source: "NGO" | "SELF";
	isAvailable: boolean;
	createdAt: string | null;
}

interface NgoDonorsTableProps {
	loading: boolean;
	donors: NgoDonorRecord[];
	updatingId?: string | null;
	onUpdateStatus?: (record: NgoDonorRecord, status: "APPROVED" | "REJECTED") => void;
}

const NgoDonorsTable: React.FC<NgoDonorsTableProps> = ({loading, donors, updatingId, onUpdateStatus}) => {
	const columns: ColumnsType<NgoDonorRecord> = [
		{
			title: "Photo",
			dataIndex: "photo",
			width: 70,
			render: (photo: string | null, record) => (
				<Avatar src={photo || undefined} alt={record.name}>
					{!photo && record.name?.charAt(0)}
				</Avatar>
			),
		},
		{
			title: "Name",
			dataIndex: "name",
			render: (name: string, record) => (
				<div>
					<div className="font-medium">{name}</div>
					{record.source === "SELF" && <Tag color="blue">Self sign-up</Tag>}
				</div>
			),
		},
		{title: "Blood Group", dataIndex: "bloodGroup", width: 110},
		{title: "Age", dataIndex: "dob", width: 70, render: (dob: string) => (dob ? dayjs().diff(dayjs(dob), "year") : "-")},
		{title: "Contact", dataIndex: "phone", width: 130},
		{title: "Area", key: "area", ellipsis: true, render: (_, record) => record.locationName || record.address || "-"},
		{
			title: "Available",
			dataIndex: "isAvailable",
			width: 100,
			render: (isAvailable: boolean) => (isAvailable ? <Tag color="green">Yes</Tag> : <Tag>Paused</Tag>),
		},
		{title: "Joined", dataIndex: "createdAt", width: 120, render: (value: string | null) => (value ? dayjs(value).format("DD MMM YYYY") : "-")},
	];

	if (onUpdateStatus) {
		columns.push({
			title: "Action",
			key: "action",
			width: 200,
			render: (_, record) => (
				<Space>
					{record.status !== "APPROVED" && (
						<Button size="small" type="primary" icon={<CheckOutlined />} loading={updatingId === record.id} onClick={() => onUpdateStatus(record, "APPROVED")}>
							Approve
						</Button>
					)}
					{record.status === "PENDING" && (
						<Popconfirm title="Reject this donor?" description="They can apply to another NGO." okText="Reject" okButtonProps={{danger: true}} onConfirm={() => onUpdateStatus(record, "REJECTED")}>
							<Button size="small" danger icon={<CloseOutlined />} disabled={updatingId === record.id}>
								Reject
							</Button>
						</Popconfirm>
					)}
				</Space>
			),
		});
	}

	return (
		<div className="bg-white border rounded-md border-gray-100">
			<Table rowKey="id" columns={columns} dataSource={donors} loading={loading} scroll={{x: 1000}} pagination={{pageSize: 20, showTotal: (total) => `Total ${total} donors`}} />
		</div>
	);
};

export default NgoDonorsTable;
