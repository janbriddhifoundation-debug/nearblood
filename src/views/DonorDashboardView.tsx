"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import {Avatar, Button, Card, Spin, Switch, Tag, message} from "antd";
import {CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, HeartOutlined, MailOutlined, PhoneOutlined, TeamOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import DonorDonationsTable from "@/components/Donor/DonorDonationsTable";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {IDonorDonation, IDonorMe} from "@/types/donorTypes";

function StatCard({icon, title, value, hint}: {icon: React.ReactNode; title: string; value: React.ReactNode; hint?: React.ReactNode}) {
	return (
		<Card className="h-full !rounded-xl" styles={{body: {padding: 20}}}>
			<div className="flex items-start gap-4">
				<div className="flex-none h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-xl !text-red-500">{icon}</div>
				<div className="min-w-0">
					<div className="text-sm text-gray-500">{title}</div>
					<div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
					<Show IF={!!hint}>
						<div className="text-xs text-gray-500 mt-1">{hint}</div>
					</Show>
				</div>
			</div>
		</Card>
	);
}

const DonorDashboardView = () => {
	const [loading, setLoading] = useState(true);
	const [me, setMe] = useState<IDonorMe | null>(null);
	const [donations, setDonations] = useState<IDonorDonation[]>([]);
	const [savingAvailability, setSavingAvailability] = useState(false);

	const fetchDashboard = useCallback(async () => {
		try {
			setLoading(true);
			const [meResponse, donationsResponse] = await Promise.all([axios.get("/api/v1/donor/me"), axios.get("/api/v1/donor/donations")]);
			setMe(meResponse.data);
			setDonations(donationsResponse.data?.data ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDashboard();
	}, [fetchDashboard]);

	const handleAvailabilityChange = async (isAvailable: boolean) => {
		try {
			setSavingAvailability(true);
			await axios.patch("/api/v1/donor/me/availability", {isAvailable});
			setMe((prev) => (prev ? {...prev, donor: {...prev.donor, isAvailable}} : prev));
			message.success(isAvailable ? "You're available to donate" : "Donation requests paused");
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setSavingAvailability(false);
		}
	};

	if (loading || !me) {
		return (
			<div className="h-[70vh] flex items-center justify-center">
				<Spin size="large" spinning={loading} />
				<Show IF={!loading && !me}>
					<span className="text-gray-500">Could not load your dashboard.</span>
				</Show>
			</div>
		);
	}

	const {donor, organisation, stats} = me;

	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				<div className="flex items-center gap-4">
					<Avatar size={64} src={donor.photoUrl || undefined} alt={donor.name ?? "Donor"} className="!bg-red-100 !text-red-600 !text-2xl">
						{donor.name?.charAt(0)}
					</Avatar>
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">Hello, {donor.name?.split(" ")[0]}</h1>
						<div className="flex flex-wrap items-center gap-2 mt-1">
							<Tag color="red" className="!text-base !font-semibold">
								{donor.bloodGroup}
							</Tag>
							<span className="text-sm text-gray-600">Donor since {donor.createdAt ? dayjs(donor.createdAt).format("MMM YYYY") : "-"}</span>
						</div>
					</div>
				</div>

				<Card size="small" className="!rounded-xl">
					<div className="flex items-center gap-3">
						<Switch checked={donor.isAvailable} loading={savingAvailability} onChange={handleAvailabilityChange} aria-label="Available to donate" />
						<div>
							<div className="font-medium">{donor.isAvailable ? "Available to donate" : "Paused"}</div>
							<div className="text-xs text-gray-500">{donor.isAvailable ? "Your NGO can contact you for requests" : "Your NGO won't contact you for now"}</div>
						</div>
					</div>
				</Card>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
				<StatCard icon={<HeartOutlined />} title="Total donations" value={stats.totalDonations} hint={stats.totalDonations > 0 ? `Up to ${stats.totalDonations * 3} lives helped` : "Your first donation will show here"} />
				<StatCard icon={<CalendarOutlined />} title="Last donation" value={stats.lastDonatedAt ? dayjs(stats.lastDonatedAt).format("DD MMM YYYY") : "—"} />
				<StatCard
					icon={stats.isEligibleNow ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
					title="Next eligible"
					value={stats.isEligibleNow ? "Now" : dayjs(stats.nextEligibleAt).format("DD MMM YYYY")}
					hint={stats.isEligibleNow ? "You can donate if you feel well" : `${dayjs(stats.nextEligibleAt).diff(dayjs(), "day")} days to go`}
				/>
				<StatCard icon={<TeamOutlined />} title="Times called" value={stats.timesAssigned} hint="Requests your NGO assigned you to" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Recent donations */}
				<Card
					className="lg:col-span-2 !rounded-xl"
					title="Recent donations"
					extra={
						<Link href="/donor/donations" className="!text-red-600">
							View all
						</Link>
					}>
					<DonorDonationsTable data={donations.slice(0, 5)} loading={false} compact />
				</Card>

				{/* NGO */}
				<Card className="!rounded-xl" title="Your NGO">
					<Show IF={!!organisation}>
						<div className="font-semibold text-gray-900 text-lg">{organisation?.name}</div>
						<Show IF={!!organisation?.type}>
							<Tag className="!mt-1">{organisation?.type}</Tag>
						</Show>
						<Show IF={!!organisation?.address}>
							<p className="text-sm text-gray-600 mt-3">{organisation?.address}</p>
						</Show>
						<Show IF={!!organisation?.contact}>
							<div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
								<div className="font-medium text-gray-800">
									{organisation?.contact?.name}
									<span className="text-gray-500 font-normal">{organisation?.contact?.designation ? `, ${organisation.contact.designation}` : ""}</span>
								</div>
								<Show IF={!!organisation?.contact?.phone}>
									<a href={`tel:${organisation?.contact?.phone}`} className="flex items-center gap-2 !text-gray-600 hover:!text-red-600">
										<PhoneOutlined /> {organisation?.contact?.phone}
									</a>
								</Show>
								<Show IF={!!organisation?.contact?.email}>
									<a href={`mailto:${organisation?.contact?.email}`} className="flex items-center gap-2 !text-gray-600 hover:!text-red-600 break-all">
										<MailOutlined /> {organisation?.contact?.email}
									</a>
								</Show>
							</div>
						</Show>
					</Show>
					<Show IF={!organisation}>
						<p className="text-gray-500">You are not linked to an NGO.</p>
					</Show>

					<Link href="/user/dashboard">
						<Button block icon={<HeartOutlined />} className="!mt-6">
							Need blood? Raise a request
						</Button>
					</Link>
				</Card>
			</div>
		</div>
	);
};

export default DonorDashboardView;
