"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import {Avatar, Input, Select, Table, Tag, Tooltip, message} from "antd";
import type {ColumnsType} from "antd/es/table";
import {LinkOutlined} from "@ant-design/icons";
import {BLOOD_GROUPS} from "@/data/Others";
import {DONOR_STATUS_LABELS} from "@/data/Donor";
import {getErrorMessage} from "@/utils/getErrorMessage";

export interface AdminDonorRecord {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	gender: string | null;
	dob: string | null;
	bloodGroup: string | null;
	photo: string | null;
	locationName: string | null;
	status: keyof typeof DONOR_STATUS_LABELS;
	source: "NGO" | "SELF";
	isAvailable: boolean;
	lastDonatedAt: string | null;
	createdAt: string | null;
	hasAccount: boolean;
	organisation: {id: string; name: string | null} | null;
	donationCount: number;
}

interface AdminDonorsPanelProps {
	organisations: {id: string; name: string | null}[];
}

const PAGE_SIZE = 10;

const AdminDonorsPanel: React.FC<AdminDonorsPanelProps> = ({organisations}) => {
	const [loading, setLoading] = useState(false);
	const [donors, setDonors] = useState<AdminDonorRecord[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE);
	const [filters, setFilters] = useState<{search?: string; status?: string; source?: string; bloodGroup?: string; organisationId?: string}>({});

	const fetchDonors = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/admin/donors", {params: {page, pageSize, ...filters}});
			setDonors(data?.data ?? []);
			setTotal(data?.pagination?.total ?? 0);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, filters]);

	useEffect(() => {
		void fetchDonors();
	}, [fetchDonors]);

	const updateFilter = (key: keyof typeof filters, value?: string) => {
		setPage(1);
		setFilters((prev) => ({...prev, [key]: value || undefined}));
	};

	const columns: ColumnsType<AdminDonorRecord> = [
		{
			title: "Donor",
			key: "donor",
			width: 240,
			render: (_, record) => (
				<div className="flex items-center gap-3">
					<Avatar src={record.photo || undefined} alt={record.name ?? "Donor"}>
						{!record.photo && record.name?.charAt(0)}
					</Avatar>
					<div className="min-w-0">
						<div className="font-medium truncate">
							{record.name}{" "}
							{record.hasAccount && (
								<Tooltip title="Has a NearBlood login">
									<LinkOutlined className="!text-blue-500" />
								</Tooltip>
							)}
						</div>
						<div className="text-xs text-gray-500 truncate">{record.phone}</div>
					</div>
				</div>
			),
		},
		{title: "Blood", dataIndex: "bloodGroup", width: 80, render: (value: string | null) => (value ? <Tag color="red">{value}</Tag> : "-")},
		{title: "NGO", key: "organisation", width: 180, ellipsis: true, render: (_, record) => record.organisation?.name ?? "-"},
		{title: "Area", dataIndex: "locationName", width: 200, ellipsis: true, render: (value: string | null) => value || "-"},
		{
			title: "Status",
			dataIndex: "status",
			width: 110,
			render: (status: AdminDonorRecord["status"]) => <Tag color={DONOR_STATUS_LABELS[status].color}>{DONOR_STATUS_LABELS[status].label}</Tag>,
		},
		{title: "Joined via", dataIndex: "source", width: 110, render: (source: AdminDonorRecord["source"]) => (source === "SELF" ? <Tag color="blue">Self sign-up</Tag> : <Tag>Added by NGO</Tag>)},
		{title: "Donations", dataIndex: "donationCount", width: 100, align: "center"},
		{title: "Last donated", dataIndex: "lastDonatedAt", width: 120, render: (value: string | null) => (value ? dayjs(value).format("DD MMM YYYY") : "-")},
		{title: "Available", dataIndex: "isAvailable", width: 100, render: (value: boolean) => (value ? <Tag color="green">Yes</Tag> : <Tag>Paused</Tag>)},
	];

	return (
		<div>
			<div className="flex flex-wrap gap-3 mb-6">
				<Input.Search placeholder="Name, email, phone or area" allowClear onSearch={(value) => updateFilter("search", value.trim())} className="!w-[280px]" />
				<Select
					placeholder="Status"
					allowClear
					className="w-[150px]"
					onChange={(value) => updateFilter("status", value)}
					options={Object.entries(DONOR_STATUS_LABELS).map(([value, {label}]) => ({value, label}))}
				/>
				<Select
					placeholder="Joined via"
					allowClear
					className="w-[150px]"
					onChange={(value) => updateFilter("source", value)}
					options={[
						{value: "SELF", label: "Self sign-up"},
						{value: "NGO", label: "Added by NGO"},
					]}
				/>
				<Select placeholder="Blood group" allowClear className="w-[140px]" onChange={(value) => updateFilter("bloodGroup", value)} options={BLOOD_GROUPS.map((group) => ({value: group, label: group}))} />
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
				dataSource={donors}
				loading={loading}
				scroll={{x: 1300}}
				pagination={{
					current: page,
					pageSize,
					total,
					showSizeChanger: true,
					showTotal: (count) => `Total ${count} donors`,
					onChange: (newPage, newPageSize) => {
						setPage(newPage);
						setPageSize(newPageSize);
					},
				}}
			/>
		</div>
	);
};

export default AdminDonorsPanel;
