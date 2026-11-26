"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Card, Spin, Tabs, Tag, message} from "antd";
import {CheckCircleOutlined, ClockCircleOutlined, HeartOutlined, SafetyCertificateOutlined, TeamOutlined} from "@ant-design/icons";
import AdminDonorsPanel from "@/components/Admin/AdminDonorsPanel";
import AdminDonationsPanel from "@/components/Admin/AdminDonationsPanel";
import {BLOOD_GROUPS} from "@/data/Others";
import {getErrorMessage} from "@/utils/getErrorMessage";

type TSummary = {
	totalDonors: number;
	status: Record<string, number>;
	source: Record<string, number>;
	bloodGroups: Record<string, number>;
	availableDonors: number;
	donorsWithAccount: number;
	totalDonations: number;
	pendingCertificates: number;
};

function StatCard({icon, title, value, hint}: {icon: React.ReactNode; title: string; value: number; hint?: string}) {
	return (
		<Card className="h-full" styles={{body: {padding: 20}}}>
			<div className="flex items-start gap-4">
				<div className="flex-none h-11 w-11 rounded-full bg-red-100 flex items-center justify-center text-lg !text-red-500">{icon}</div>
				<div>
					<div className="text-sm text-gray-500">{title}</div>
					<div className="text-3xl font-semibold">{value}</div>
					{hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
				</div>
			</div>
		</Card>
	);
}

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [summary, setSummary] = useState<TSummary | null>(null);
	const [organisations, setOrganisations] = useState<{id: string; name: string | null}[]>([]);

	const fetchSummary = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/admin/donors/summary");
			setSummary(data?.summary ?? null);
			setOrganisations(data?.organisations ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchSummary();
	}, [fetchSummary]);

	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<div className="text-2xl font-semibold mb-5">Donor & donation oversight</div>
			<div className="text-sm leading-[22px] text-gray-600 mb-8">All donors across NGOs, how they joined, and every donation from assignment to certificate.</div>

			<Spin spinning={loading}>
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
					<StatCard icon={<TeamOutlined />} title="Total donors" value={summary?.totalDonors ?? 0} hint={`${summary?.source?.SELF ?? 0} self sign-ups · ${summary?.donorsWithAccount ?? 0} with login`} />
					<StatCard icon={<ClockCircleOutlined />} title="Waiting for NGO approval" value={summary?.status?.PENDING ?? 0} />
					<StatCard icon={<CheckCircleOutlined />} title="Available now" value={summary?.availableDonors ?? 0} hint="Approved and not paused" />
					<StatCard icon={<HeartOutlined />} title="Donations certified" value={summary?.totalDonations ?? 0} />
					<StatCard icon={<SafetyCertificateOutlined />} title="Certificates not issued" value={summary?.pendingCertificates ?? 0} hint="Closed requests without a certificate" />
				</div>

				<Card size="small" className="!mb-8">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm text-gray-600 mr-2">Approved donors by blood group:</span>
						{BLOOD_GROUPS.map((group) => (
							<Tag key={group} color={summary?.bloodGroups?.[group] ? "red" : "default"}>
								{group}: {summary?.bloodGroups?.[group] ?? 0}
							</Tag>
						))}
					</div>
				</Card>
			</Spin>

			<Tabs
				items={[
					{key: "donors", label: "Donors", children: <AdminDonorsPanel organisations={organisations} />},
					{key: "donations", label: "Donations", children: <AdminDonationsPanel organisations={organisations} />},
				]}
			/>
		</div>
	);
};

export default Page;
