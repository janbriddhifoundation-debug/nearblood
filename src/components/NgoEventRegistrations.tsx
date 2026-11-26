"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import {Avatar, Button, Card, InputNumber, Popover, Space, Table, Tag, message} from "antd";
import type {ColumnsType} from "antd/es/table";
import {CheckOutlined, CloseOutlined, UndoOutlined} from "@ant-design/icons";
import {getErrorMessage} from "@/utils/getErrorMessage";

type TRegistrationStatus = "REGISTERED" | "ATTENDED" | "NO_SHOW" | "CANCELLED";

interface RegistrationRecord {
	id: string;
	status: TRegistrationStatus;
	unitsDonated: number | null;
	createdAt: string;
	donor: {id: string; name: string | null; phone: string | null; bloodGroup: string | null; photo: string | null; organisationName: string | null};
}

const STATUS_TAGS: Record<TRegistrationStatus, {label: string; color: string}> = {
	REGISTERED: {label: "Registered", color: "processing"},
	ATTENDED: {label: "Donated", color: "success"},
	NO_SHOW: {label: "Didn't come", color: "default"},
	CANCELLED: {label: "Cancelled", color: "default"},
};

interface NgoEventRegistrationsProps {
	eventId: string;
	eventDate?: string;
	onCountsChanged: () => void;
}

// Camp registrations with attendance marking. Attendance can only be marked from the camp day on.
const NgoEventRegistrations: React.FC<NgoEventRegistrationsProps> = ({eventId, eventDate, onCountsChanged}) => {
	const [loading, setLoading] = useState(true);
	const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
	const [savingId, setSavingId] = useState<string | null>(null);
	const [units, setUnits] = useState<number>(1);

	const canMarkAttendance = !!eventDate && !dayjs(eventDate).isAfter(dayjs(), "day");

	const fetchRegistrations = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get(`/api/v1/ngo/events/${eventId}/registrations`);
			setRegistrations(data?.data ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [eventId]);

	useEffect(() => {
		void fetchRegistrations();
	}, [fetchRegistrations]);

	const updateRegistration = async (record: RegistrationRecord, status: "REGISTERED" | "ATTENDED" | "NO_SHOW", unitsDonated?: number) => {
		try {
			setSavingId(record.id);
			await axios.patch(`/api/v1/ngo/events/${eventId}/registrations/${record.id}`, {status, unitsDonated: unitsDonated ?? null});
			await fetchRegistrations();
			onCountsChanged();
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setSavingId(null);
		}
	};

	const columns: ColumnsType<RegistrationRecord> = [
		{
			title: "Donor",
			key: "donor",
			render: (_, record) => (
				<div className="flex items-center gap-3">
					<Avatar src={record.donor.photo || undefined}>{!record.donor.photo && record.donor.name?.charAt(0)}</Avatar>
					<div>
						<div className="font-medium">{record.donor.name}</div>
						{record.donor.organisationName && <div className="text-xs text-gray-500">From {record.donor.organisationName}</div>}
					</div>
				</div>
			),
		},
		{title: "Blood", key: "blood", width: 80, render: (_, record) => <Tag color="red">{record.donor.bloodGroup}</Tag>},
		{title: "Phone", key: "phone", width: 130, render: (_, record) => record.donor.phone ?? "-"},
		{title: "Registered", dataIndex: "createdAt", width: 120, render: (value: string) => dayjs(value).format("DD MMM YYYY")},
		{
			title: "Status",
			dataIndex: "status",
			width: 160,
			render: (status: TRegistrationStatus, record) => (
				<Tag color={STATUS_TAGS[status].color}>
					{STATUS_TAGS[status].label}
					{status === "ATTENDED" && record.unitsDonated ? ` · ${record.unitsDonated} unit(s)` : ""}
				</Tag>
			),
		},
		{
			title: "Attendance",
			key: "action",
			width: 220,
			render: (_, record) => {
				if (record.status === "CANCELLED") return <span className="text-gray-400">-</span>;
				if (!canMarkAttendance) return <span className="text-xs text-gray-400">From the camp day</span>;
				if (record.status !== "REGISTERED") {
					return (
						<Button size="small" icon={<UndoOutlined />} loading={savingId === record.id} onClick={() => updateRegistration(record, "REGISTERED")}>
							Undo
						</Button>
					);
				}
				return (
					<Space>
						<Popover
							trigger="click"
							title="Units donated"
							content={
								<div className="flex items-center gap-2">
									<InputNumber min={1} max={2} value={units} onChange={(value) => setUnits(value ?? 1)} />
									<Button type="primary" size="small" onClick={() => updateRegistration(record, "ATTENDED", units)}>
										Save
									</Button>
								</div>
							}>
							<Button size="small" type="primary" icon={<CheckOutlined />} loading={savingId === record.id}>
								Donated
							</Button>
						</Popover>
						<Button size="small" icon={<CloseOutlined />} disabled={savingId === record.id} onClick={() => updateRegistration(record, "NO_SHOW")}>
							Didn&apos;t come
						</Button>
					</Space>
				);
			},
		},
	];

	return (
		<Card title={`Registered donors (${registrations.filter((item) => item.status !== "CANCELLED").length})`} className="!mb-6">
			<Table rowKey="id" columns={columns} dataSource={registrations} loading={loading} scroll={{x: 900}} pagination={{pageSize: 20}} locale={{emptyText: "No donors have registered yet. Active donors were notified when you created this camp."}} />
		</Card>
	);
};

export default NgoEventRegistrations;
