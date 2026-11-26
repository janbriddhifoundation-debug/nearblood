"use client";

import React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {Button, Table, Tag} from "antd";
import type {ColumnsType} from "antd/es/table";
import {SafetyCertificateOutlined} from "@ant-design/icons";
import {IDonorDonation} from "@/types/donorTypes";

const REQUEST_STATUS_TAGS: Record<string, {label: string; color: string}> = {
	DONORS_ASSIGNED: {label: "Assigned", color: "processing"},
	DONATION_PROOF_SUBMITTED: {label: "Proof submitted", color: "purple"},
	REQUEST_CLOSED: {label: "Completed", color: "success"},
};

interface DonorDonationsTableProps {
	data: IDonorDonation[];
	loading: boolean;
	compact?: boolean;
}

const DonorDonationsTable: React.FC<DonorDonationsTableProps> = ({data, loading, compact = false}) => {
	const columns: ColumnsType<IDonorDonation> = [
		{
			title: "Date",
			key: "date",
			width: 130,
			render: (_, record) => {
				const date = record.certificate?.generatedAt ?? record.requirementDate ?? record.assignedAt;
				return date ? dayjs(date).format("DD MMM YYYY") : "-";
			},
		},
		{
			title: "Hospital",
			dataIndex: "hospital",
			ellipsis: true,
			render: (hospital: string | null, record) => (
				<div>
					<div className="font-medium">{hospital || "-"}</div>
					{!compact && record.locationName && <div className="text-xs text-gray-500 truncate">{record.locationName}</div>}
				</div>
			),
		},
		{title: "Blood group", dataIndex: "bloodGroup", width: 110},
		{
			title: "Status",
			key: "status",
			width: 140,
			render: (_, record) => {
				if (record.certificate) return <Tag color="success">Donated</Tag>;
				const tag = REQUEST_STATUS_TAGS[record.requestStatus];
				return tag ? <Tag color={tag.color}>{tag.label}</Tag> : <Tag>{record.requestStatus}</Tag>;
			},
		},
		{
			title: "Certificate",
			key: "certificate",
			width: 140,
			render: (_, record) =>
				record.certificate ? (
					<Link href={`/donor/certificates/${record.id}`}>
						<Button size="small" icon={<SafetyCertificateOutlined />}>
							View
						</Button>
					</Link>
				) : (
					<span className="text-gray-400">-</span>
				),
		},
	];

	if (!compact) {
		columns.splice(3, 0, {title: "Through", dataIndex: "organisationName", width: 180, ellipsis: true, render: (value: string | null) => value || "-"});
	}

	return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{x: compact ? 600 : 900}} pagination={compact ? false : {pageSize: 10}} locale={{emptyText: "No donations yet"}} />;
};

export default DonorDonationsTable;
