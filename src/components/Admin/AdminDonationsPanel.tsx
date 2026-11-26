"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import {Input, Select, Table, Tag, message} from "antd";
import type {ColumnsType} from "antd/es/table";
import {getErrorMessage} from "@/utils/getErrorMessage";

export interface AdminDonationRecord {
	id: string;
	assignedAt: string | null;
	donor: {id: string; name: string | null; bloodGroup: string | null} | null;
	organisation: {id: string; name: string | null} | null;
	requestId: string | null;
	hospital: string | null;
	bloodGroup: string | null;
	requirementDate: string | null;
	requestStatus: string;
	certificate: {certificateNumber: string; generatedAt: string} | null;
}

const REQUEST_STATUS_TAGS: Record<string, {label: string; color: string}> = {
	REQUEST_SENT: {label: "Request sent", color: "default"},
	DONORS_ASSIGNED: {label: "Donors assigned", color: "processing"},
	DONATION_PROOF_SUBMITTED: {label: "Proof submitted", color: "purple"},
	REQUEST_CLOSED: {label: "Closed", color: "success"},
};

interface AdminDonationsPanelProps {
	organisations: {id: string; name: string | null}[];
}

const AdminDonationsPanel: React.FC<AdminDonationsPanelProps> = ({organisations}) => {
	const [loading, setLoading] = useState(false);
	const [rows, setRows] = useState<AdminDonationRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [filters, setFilters] = useState<{search?: string; certified?: string; organisationId?: string}>({});

	const fetchDonations = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/admin/donations", {params: {page, pageSize, ...filters}});
			setRows(data?.data ?? []);
			setTotal(data?.pagination?.total ?? 0);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, filters]);

	useEffect(() => {
		void fetchDonations();
	}, [fetchDonations]);

	const updateFilter = (key: keyof typeof filters, value?: string) => {
		setPage(1);
		setFilters((prev) => ({...prev, [key]: value || undefined}));
	};

	const columns: ColumnsType<AdminDonationRecord> = [
		{title: "Assigned", dataIndex: "assignedAt", width: 120, render: (value: string | null) => (value ? dayjs(value).format("DD MMM YYYY") : "-")},
		{
			title: "Donor",
			key: "donor",
			width: 200,
			render: (_, record) => (
				<span>
					{record.donor?.name ?? "-"} {record.donor?.bloodGroup && <Tag color="red">{record.donor.bloodGroup}</Tag>}
				</span>
			),
		},
		{title: "NGO", key: "organisation", width: 180, ellipsis: true, render: (_, record) => record.organisation?.name ?? "-"},
		{
			title: "Request",
			key: "request",
			width: 220,
			render: (_, record) =>
				record.requestId ? (
					<div>
						<Link href={`/admin/blood-request-monitoring/${record.requestId}`} className="!text-red-600 font-medium">
							{record.requestId}
						</Link>
						<div className="text-xs text-gray-500 truncate">{record.hospital}</div>
					</div>
				) : (
					"-"
				),
		},
		{
			title: "Stage",
			dataIndex: "requestStatus",
			width: 150,
			render: (value: string) => {
				const tag = REQUEST_STATUS_TAGS[value];
				return tag ? <Tag color={tag.color}>{tag.label}</Tag> : <Tag>{value}</Tag>;
			},
		},
		{
			title: "Certificate",
			key: "certificate",
			width: 170,
			render: (_, record) =>
				record.certificate ? (
					<Link href={`/view-certificate/${encodeURIComponent(record.certificate.certificateNumber)}`} target="_blank" className="!text-gray-700 hover:!text-red-600">
						{record.certificate.certificateNumber}
					</Link>
				) : record.requestStatus === "REQUEST_CLOSED" ? (
					<Tag color="gold">Not issued</Tag>
				) : (
					<span className="text-gray-400">-</span>
				),
		},
	];

	return (
		<div>
			<div className="flex flex-wrap gap-3 mb-6">
				<Input.Search placeholder="Donor, hospital, request ID or certificate" allowClear onSearch={(value) => updateFilter("search", value.trim())} className="!w-[320px]" />
				<Select
					placeholder="Certificate"
					allowClear
					className="w-[170px]"
					onChange={(value) => updateFilter("certified", value)}
					options={[
						{value: "yes", label: "Issued"},
						{value: "no", label: "Not issued"},
					]}
				/>
				<Select
					placeholder="NGO"
					allowClear
					showSearch
					optionFilterProp="label"
					className="w-[220px]"
					onChange={(value) => updateFilter("organisationId", value)}
					options={organisations.map((organisation) => ({value: organisation.id, label: organisation.name ?? organisation.id}))}
				/>
			</div>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={rows}
				loading={loading}
				scroll={{x: 1050}}
				pagination={{
					current: page,
					pageSize,
					total,
					showSizeChanger: true,
					showTotal: (count) => `Total ${count} assignments`,
					onChange: (newPage, newPageSize) => {
						setPage(newPage);
						setPageSize(newPageSize);
					},
				}}
			/>
		</div>
	);
};

export default AdminDonationsPanel;
