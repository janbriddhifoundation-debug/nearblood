"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import {Button, Card, Empty, Popconfirm, Progress, Spin, Table, Tag, message} from "antd";
import {CheckCircleOutlined, EnvironmentOutlined, TeamOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {NEARBY_NGO_RADIUS_KM} from "@/data/Donor";

type TCamp = {
	id: string;
	eventName: string;
	purpose: string | null;
	eventDate: string;
	venueName: string | null;
	imageUrl: string | null;
	donorsRequired: number | null;
	registeredDonors: number;
	status: "ACTIVE" | "ONGOING";
	organisationName: string | null;
	isMyNgo: boolean;
	distanceKm: number | null;
	myRegistration: "REGISTERED" | "ATTENDED" | "NO_SHOW" | "CANCELLED" | null;
};

type THistory = {
	id: string;
	status: "REGISTERED" | "ATTENDED" | "NO_SHOW";
	unitsDonated: number | null;
	eventName: string;
	eventDate: string;
	venueName: string | null;
	organisationName: string | null;
};

const HISTORY_STATUS: Record<THistory["status"], {label: string; color: string}> = {
	ATTENDED: {label: "Donated", color: "success"},
	NO_SHOW: {label: "Missed", color: "default"},
	REGISTERED: {label: "Not marked yet", color: "gold"},
};

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [camps, setCamps] = useState<TCamp[]>([]);
	const [history, setHistory] = useState<THistory[]>([]);
	const [savingId, setSavingId] = useState<string | null>(null);

	const fetchCamps = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/donor/camps");
			setCamps(data?.data ?? []);
			setHistory(data?.history ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchCamps();
	}, [fetchCamps]);

	const handleRegistration = async (camp: TCamp, register: boolean) => {
		try {
			setSavingId(camp.id);
			if (register) {
				await axios.post(`/api/v1/donor/camps/${camp.id}/registration`);
				message.success(`You're registered for ${camp.eventName}`);
			} else {
				await axios.delete(`/api/v1/donor/camps/${camp.id}/registration`);
				message.success("Registration cancelled");
			}
			await fetchCamps();
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setSavingId(null);
		}
	};

	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			<div className="text-2xl font-semibold mb-2">Blood camps</div>
			<div className="text-sm text-gray-600 mb-8">Upcoming camps by your NGO and other NGOs within {NEARBY_NGO_RADIUS_KM} km. Register so the organisers know to expect you.</div>

			<Spin spinning={loading}>
				<Show IF={!loading && camps.length === 0}>
					<Card className="!rounded-xl !mb-8">
						<Empty description="No upcoming camps near you right now. You'll get a notification when your NGO plans one." />
					</Card>
				</Show>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
					{camps.map((camp) => {
						const isRegistered = camp.myRegistration === "REGISTERED";
						return (
							<Card
								key={camp.id}
								className="!rounded-xl overflow-hidden"
								styles={{body: {padding: 20}}}
								cover={
									camp.imageUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={camp.imageUrl} alt={camp.eventName} className="h-40 w-full object-cover" />
									) : undefined
								}>
								<div className="flex gap-4">
									<div className="flex-none w-14 text-center rounded-lg bg-red-50 py-1 h-fit">
										<div className="text-xs text-red-600 uppercase">{dayjs(camp.eventDate).format("MMM")}</div>
										<div className="text-xl font-bold text-red-600 leading-tight">{dayjs(camp.eventDate).format("DD")}</div>
									</div>
									<div className="min-w-0">
										<div className="font-semibold text-gray-900">{camp.eventName}</div>
										<div className="text-sm text-gray-600">{camp.organisationName}</div>
										<div className="flex flex-wrap gap-1 mt-2">
											{camp.isMyNgo && <Tag color="red">Your NGO</Tag>}
											{camp.status === "ONGOING" && <Tag color="green">Happening now</Tag>}
										</div>
									</div>
								</div>

								<Show IF={!!camp.venueName}>
									<div className="flex items-start gap-2 text-sm text-gray-600 mt-3">
										<EnvironmentOutlined className="mt-1 !text-red-500" />
										<span>
											{camp.venueName}
											{camp.distanceKm !== null ? ` · ${camp.distanceKm} km away` : ""}
										</span>
									</div>
								</Show>
								<Show IF={!!camp.purpose}>
									<p className="text-sm text-gray-500 mt-2 line-clamp-2">{camp.purpose}</p>
								</Show>

								<div className="mt-3">
									<div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
										<TeamOutlined /> {camp.registeredDonors} registered{camp.donorsRequired ? ` of ${camp.donorsRequired} needed` : ""}
									</div>
									<Show IF={!!camp.donorsRequired}>
										<Progress percent={camp.donorsRequired ? Math.round((camp.registeredDonors / camp.donorsRequired) * 100) : 0} showInfo={false} size="small" strokeColor="#ef4444" />
									</Show>
								</div>

								<div className="mt-4">
									{isRegistered ? (
										<div className="flex items-center justify-between gap-2">
											<span className="flex items-center gap-1 text-green-600 font-medium">
												<CheckCircleOutlined /> You&apos;re registered
											</span>
											<Popconfirm title="Cancel your registration?" onConfirm={() => handleRegistration(camp, false)}>
												<Button size="small" loading={savingId === camp.id}>
													Cancel
												</Button>
											</Popconfirm>
										</div>
									) : (
										<Button type="primary" block loading={savingId === camp.id} onClick={() => handleRegistration(camp, true)}>
											Register to donate
										</Button>
									)}
								</div>
							</Card>
						);
					})}
				</div>

				<Card className="!rounded-xl" title="Camps you joined">
					<Table
						rowKey="id"
						dataSource={history}
						pagination={false}
						scroll={{x: 700}}
						locale={{emptyText: "No past camps yet"}}
						columns={[
							{title: "Date", dataIndex: "eventDate", width: 130, render: (value: string) => dayjs(value).format("DD MMM YYYY")},
							{title: "Camp", dataIndex: "eventName"},
							{title: "NGO", dataIndex: "organisationName", render: (value: string | null) => value ?? "-"},
							{
								title: "Result",
								dataIndex: "status",
								width: 170,
								render: (status: THistory["status"], record: THistory) => (
									<Tag color={HISTORY_STATUS[status].color}>
										{HISTORY_STATUS[status].label}
										{status === "ATTENDED" && record.unitsDonated ? ` · ${record.unitsDonated} unit(s)` : ""}
									</Tag>
								),
							},
						]}
					/>
				</Card>
			</Spin>
		</div>
	);
};

export default Page;
