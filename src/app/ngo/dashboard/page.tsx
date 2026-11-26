"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import {Button, Card, Empty, Progress, Spin, Tag, message} from "antd";
import {CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, HeartOutlined, SafetyCertificateOutlined, TeamOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import StatCard from "@/components/StatCard";
import {useUserStore} from "@/stores/useUserStore";
import {BLOOD_GROUPS} from "@/data/Others";
import {getErrorMessage} from "@/utils/getErrorMessage";

type TDashboard = {
	stats: {
		nearbyOpenRequests: number;
		activeDonors: number;
		availableDonors: number;
		pendingDonors: number;
		upcomingEvents: number;
		donationsThisMonth: number;
		totalCertificates: number;
	};
	donorsByBloodGroup: Record<string, number>;
	nearbyRequests: {id: string; bloodGroup: string | null; units: number | null; urgency: string | null; hospital: string | null; requirementDate: string | null; lastActivity: string | null}[];
	pendingDonors: {id: string; name: string | null; bloodGroup: string | null; locationName: string | null; createdAt: string | null}[];
	upcomingEvents: {id: string; eventName: string; eventDate: string; venueName: string | null; donorsRequired: number | null; registeredDonors: number}[];
};

const URGENCY_COLORS: Record<string, string> = {high: "red", medium: "orange", low: "blue"};

const Page = () => {
	const organisationName = useUserStore((state) => state.user?.organisation?.name);
	const [loading, setLoading] = useState(true);
	const [dashboard, setDashboard] = useState<TDashboard | null>(null);

	const fetchDashboard = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/ngo/dashboard");
			setDashboard(data);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDashboard();
	}, [fetchDashboard]);

	if (loading || !dashboard) {
		return (
			<div className="h-[70vh] flex items-center justify-center">
				<Spin size="large" spinning={loading} />
			</div>
		);
	}

	const {stats, donorsByBloodGroup, nearbyRequests, pendingDonors, upcomingEvents} = dashboard;
	const maxBloodGroupCount = Math.max(1, ...Object.values(donorsByBloodGroup));

	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<div className="text-2xl font-semibold mb-1">Welcome{organisationName ? `, ${organisationName}` : ""}</div>
			<div className="text-sm leading-[22px] text-gray-600 mb-8">Here&apos;s what needs your attention today.</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
				<StatCard icon={<FileTextOutlined />} title="Open requests near you" value={stats.nearbyOpenRequests} hint="Within 10 km of your regions" href="/ngo/requests" />
				<StatCard icon={<TeamOutlined />} title="Active donors" value={stats.activeDonors} hint={`${stats.availableDonors} available now`} href="/ngo/donors" />
				<StatCard icon={<CalendarOutlined />} title="Upcoming camps" value={stats.upcomingEvents} href="/ngo/blood-donation-events" />
				<StatCard icon={<SafetyCertificateOutlined />} title="Donations this month" value={stats.donationsThisMonth} hint={`${stats.totalCertificates} certificates in total`} href="/ngo/certificate-management" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Nearby open requests */}
				<Card
					className="lg:col-span-2 !rounded-xl"
					title="Open blood requests near you"
					extra={
						<Link href="/ngo/requests" className="!text-red-600">
							View all
						</Link>
					}>
					<Show IF={nearbyRequests.length === 0}>
						<Empty description="No open requests in your area right now" />
					</Show>
					<div className="divide-y divide-gray-100">
						{nearbyRequests.map((request) => (
							<div key={request.id} className="flex flex-wrap items-center gap-3 py-3">
								<Tag color="red" className="!text-base !font-semibold !m-0">
									{request.bloodGroup}
								</Tag>
								<div className="flex-1 min-w-[180px]">
									<div className="font-medium text-gray-900">{request.hospital || "Hospital not given"}</div>
									<div className="text-xs text-gray-500">
										{request.units ?? "-"} unit(s) · needed {request.requirementDate ? dayjs(request.requirementDate).format("DD MMM, hh:mm A") : "-"}
									</div>
								</div>
								<Show IF={!!request.urgency}>
									<Tag color={URGENCY_COLORS[request.urgency ?? ""] ?? "default"} className="capitalize">
										{request.urgency} urgency
									</Tag>
								</Show>
								<Tag color={request.lastActivity === "DONORS_ASSIGNED" ? "processing" : "gold"}>{request.lastActivity === "DONORS_ASSIGNED" ? "Donors assigned" : "Needs donors"}</Tag>
							</div>
						))}
					</div>
				</Card>

				{/* Pending donor approvals */}
				<Card
					className="!rounded-xl"
					title={
						<span className="flex items-center gap-2">
							<ClockCircleOutlined className="!text-amber-500" /> Donors waiting for you
						</span>
					}
					extra={
						<Show IF={stats.pendingDonors > 0}>
							<Link href="/ngo/donors" className="!text-red-600">
								Review ({stats.pendingDonors})
							</Link>
						</Show>
					}>
					<Show IF={pendingDonors.length === 0}>
						<div className="flex items-center gap-2 text-gray-500">
							<CheckCircleOutlined className="!text-green-500" /> No pending sign-ups
						</div>
					</Show>
					<div className="space-y-3">
						{pendingDonors.map((donor) => (
							<div key={donor.id} className="flex items-center justify-between gap-2">
								<div className="min-w-0">
									<div className="font-medium truncate">{donor.name}</div>
									<div className="text-xs text-gray-500 truncate">
										{donor.locationName ?? "-"} · {donor.createdAt ? dayjs(donor.createdAt).format("DD MMM") : ""}
									</div>
								</div>
								<Tag color="red">{donor.bloodGroup}</Tag>
							</div>
						))}
					</div>
				</Card>

				{/* Upcoming camps */}
				<Card
					className="lg:col-span-2 !rounded-xl"
					title="Upcoming camps"
					extra={
						<Link href="/ngo/blood-donation-events/add-event">
							<Button size="small" type="primary">
								Add camp
							</Button>
						</Link>
					}>
					<Show IF={upcomingEvents.length === 0}>
						<Empty description="No camps scheduled" />
					</Show>
					<div className="divide-y divide-gray-100">
						{upcomingEvents.map((event) => (
							<Link key={event.id} href={`/ngo/blood-donation-events/${event.id}`} className="flex flex-wrap items-center gap-4 py-3 !text-inherit hover:bg-gray-50 -mx-2 px-2 rounded-lg">
								<div className="flex-none w-14 text-center rounded-lg bg-red-50 py-1">
									<div className="text-xs text-red-600 uppercase">{dayjs(event.eventDate).format("MMM")}</div>
									<div className="text-xl font-bold text-red-600 leading-tight">{dayjs(event.eventDate).format("DD")}</div>
								</div>
								<div className="flex-1 min-w-[160px]">
									<div className="font-medium text-gray-900">{event.eventName}</div>
									<div className="text-xs text-gray-500">{event.venueName ?? "-"}</div>
								</div>
								<div className="w-[160px]">
									<div className="text-xs text-gray-500 mb-1">
										{event.registeredDonors} registered{event.donorsRequired ? ` / ${event.donorsRequired} needed` : ""}
									</div>
									<Progress percent={event.donorsRequired ? Math.round((event.registeredDonors / event.donorsRequired) * 100) : 0} showInfo={false} size="small" strokeColor="#ef4444" />
								</div>
							</Link>
						))}
					</div>
				</Card>

				{/* Donors by blood group */}
				<Card className="!rounded-xl" title="Active donors by blood group">
					<div className="space-y-2">
						{BLOOD_GROUPS.map((group) => (
							<div key={group} className="flex items-center gap-3">
								<span className="w-10 text-sm font-semibold text-gray-700">{group}</span>
								<Progress className="!m-0 flex-1" percent={((donorsByBloodGroup[group] ?? 0) / maxBloodGroupCount) * 100} showInfo={false} size="small" strokeColor="#ef4444" />
								<span className="w-8 text-right text-sm text-gray-600">{donorsByBloodGroup[group] ?? 0}</span>
							</div>
						))}
					</div>
					<Link href="/ngo/communication-notification">
						<Button block icon={<HeartOutlined />} className="!mt-5">
							Message your donors
						</Button>
					</Link>
				</Card>
			</div>
		</div>
	);
};

export default Page;
