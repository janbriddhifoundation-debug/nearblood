"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import Link from "next/link";
import {Badge, Button, Input, Tabs, message} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import NgoDonorsTable, {NgoDonorRecord} from "@/components/NgoDonorsTable";
import {getErrorMessage} from "@/utils/getErrorMessage";

type TDonorStatus = NgoDonorRecord["status"];

const Page = () => {
	const [loading, setLoading] = useState(false);
	const [donors, setDonors] = useState<NgoDonorRecord[]>([]);
	const [counts, setCounts] = useState<Record<TDonorStatus, number>>({PENDING: 0, APPROVED: 0, REJECTED: 0});
	const [status, setStatus] = useState<TDonorStatus>("APPROVED");
	const [searchTerm, setSearchTerm] = useState("");
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const fetchDonors = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/ngo/donors", {params: {status, searchTerm: searchTerm || undefined}});
			setDonors(data?.donors ?? []);
			setCounts(data?.counts ?? {PENDING: 0, APPROVED: 0, REJECTED: 0});
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [status, searchTerm]);

	useEffect(() => {
		void fetchDonors();
	}, [fetchDonors]);

	const handleUpdateStatus = async (record: NgoDonorRecord, newStatus: "APPROVED" | "REJECTED") => {
		try {
			setUpdatingId(record.id);
			await axios.patch(`/api/v1/ngo/donors/${record.id}/status`, {status: newStatus});
			message.success(newStatus === "APPROVED" ? `${record.name} is now an active donor` : `${record.name}'s application was rejected`);
			void fetchDonors();
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setUpdatingId(null);
		}
	};

	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<div className="text-2xl font-semibold mb-5">Donors Management</div>
			<div className="text-sm leading-[22px] text-gray-600 mb-6">Manage your donors and review people who signed up to donate through your organisation.</div>

			<Tabs
				activeKey={status}
				onChange={(key) => setStatus(key as TDonorStatus)}
				items={[
					{key: "APPROVED", label: `Active donors (${counts.APPROVED})`},
					{
						key: "PENDING",
						label: (
							<span className="flex items-center gap-2">
								Pending approval <Badge count={counts.PENDING} showZero={false} />
							</span>
						),
					},
					{key: "REJECTED", label: `Rejected (${counts.REJECTED})`},
				]}
			/>

			<div className="flex flex-wrap gap-3 mb-6 items-center">
				<Input.Search placeholder="Search by name" allowClear onSearch={(value) => setSearchTerm(value.trim())} className="!w-[280px]" />
				<Link href="/ngo/donors/add">
					<Button type="primary" icon={<PlusOutlined />}>
						Add Donor
					</Button>
				</Link>
			</div>

			<NgoDonorsTable loading={loading} donors={donors} updatingId={updatingId} onUpdateStatus={status === "APPROVED" ? undefined : handleUpdateStatus} />
		</div>
	);
};

export default Page;
