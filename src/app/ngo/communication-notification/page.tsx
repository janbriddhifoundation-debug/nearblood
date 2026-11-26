"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import {useFormik} from "formik";
import {Alert, Button, Card, Checkbox, Empty, Input, Select, Spin, Tag, message} from "antd";
import {NotificationOutlined, SendOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import {BLOOD_GROUPS} from "@/data/Others";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {showValidationErrors} from "@/utils/showValidationErrors";
import {zodFormikValidate} from "@/utils/zodFormikValidate";
import {broadcastSchema, TBroadcast} from "@/validationSchema/broadcastSchema";

const {TextArea} = Input;

type TBroadcastRecord = {
	id: string;
	title: string;
	message: string;
	bloodGroups: string[];
	availableOnly: boolean;
	recipientCount: number;
	createdAt: string;
};

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [broadcasts, setBroadcasts] = useState<TBroadcastRecord[]>([]);
	const [audience, setAudience] = useState<{matched: number; reachable: number} | null>(null);

	const formik = useFormik<TBroadcast>({
		initialValues: {title: "", message: "", bloodGroups: [], availableOnly: true},
		validate: zodFormikValidate<TBroadcast>(broadcastSchema),
		onSubmit: async (values, {resetForm}) => {
			try {
				const {data} = await axios.post("/api/v1/ngo/broadcasts", values);
				message.success(`Message sent to ${data?.broadcast?.recipientCount ?? 0} donor(s)`);
				resetForm();
				void fetchBroadcasts();
			} catch (error) {
				showValidationErrors(error);
			}
		},
	});

	const fetchBroadcasts = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/ngo/broadcasts");
			setBroadcasts(data?.data ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchBroadcasts();
	}, [fetchBroadcasts]);

	// Live count of who the message will reach
	const {bloodGroups, availableOnly} = formik.values;
	useEffect(() => {
		const fetchAudience = async () => {
			try {
				const {data} = await axios.get("/api/v1/ngo/broadcasts", {params: {audience: 1, bloodGroups: bloodGroups.join(","), availableOnly}});
				setAudience({matched: data?.matched ?? 0, reachable: data?.reachable ?? 0});
			} catch {
				setAudience(null);
			}
		};
		void fetchAudience();
	}, [bloodGroups, availableOnly]);

	const getError = (field: keyof TBroadcast) => (formik.touched[field] && formik.errors[field] ? <div className="text-red-500 text-xs py-1">{formik.errors[field] as string}</div> : null);

	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<div className="text-2xl font-semibold mb-5">Communication</div>
			<div className="text-sm leading-[22px] text-gray-600 mb-8">Send a message to your approved donors - for an urgent need, an upcoming camp or a thank-you. It appears under the bell in their donor dashboard.</div>

			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				<Card className="lg:col-span-2 !rounded-xl" title="New message">
					<form onSubmit={formik.handleSubmit} className="space-y-4">
						<div>
							<label className="block font-medium mb-1 text-gray-600">Send to blood groups</label>
							<Select mode="multiple" allowClear className="w-full" placeholder="All blood groups" value={bloodGroups} onChange={(value) => formik.setFieldValue("bloodGroups", value)} options={BLOOD_GROUPS.map((group) => ({label: group, value: group}))} />
						</div>

						<Checkbox checked={availableOnly} onChange={(e) => formik.setFieldValue("availableOnly", e.target.checked)}>
							Only donors who are available (not paused)
						</Checkbox>

						<Show IF={!!audience}>
							<Alert
								type={audience?.reachable ? "info" : "warning"}
								showIcon
								message={`${audience?.reachable ?? 0} of ${audience?.matched ?? 0} matching donors will receive this`}
								description={audience && audience.matched > audience.reachable ? "Donors you added yourself only receive messages after they sign in to NearBlood with the same email." : undefined}
							/>
						</Show>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Title</label>
							<Input name="title" placeholder="e.g. Urgent: O- needed at City Hospital" maxLength={100} value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur} />
							{getError("title")}
						</div>

						<div>
							<label className="block font-medium mb-1 text-gray-600">Message</label>
							<TextArea name="message" rows={5} maxLength={1000} showCount placeholder="What do you need donors to know or do?" value={formik.values.message} onChange={formik.handleChange} onBlur={formik.handleBlur} />
							{getError("message")}
						</div>

						<div className="flex justify-end">
							<Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={formik.isSubmitting} disabled={!audience?.reachable}>
								Send message
							</Button>
						</div>
					</form>
				</Card>

				<Card className="lg:col-span-3 !rounded-xl" title="Sent messages">
					<Spin spinning={loading}>
						<Show IF={!loading && broadcasts.length === 0}>
							<Empty description="You haven't sent any messages yet" />
						</Show>
						<div className="divide-y divide-gray-100">
							{broadcasts.map((broadcast) => (
								<div key={broadcast.id} className="py-4 flex gap-3">
									<div className="flex-none h-9 w-9 rounded-full bg-red-100 flex items-center justify-center !text-red-500">
										<NotificationOutlined />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="font-medium text-gray-900">{broadcast.title}</span>
											<span className="text-xs text-gray-500">{dayjs(broadcast.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
										</div>
										<p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{broadcast.message}</p>
										<div className="flex flex-wrap items-center gap-1 mt-2">
											{broadcast.bloodGroups.length ? broadcast.bloodGroups.map((group) => <Tag key={group}>{group}</Tag>) : <Tag>All groups</Tag>}
											{broadcast.availableOnly && <Tag>Available only</Tag>}
											<span className="text-xs text-gray-500 ml-1">Sent to {broadcast.recipientCount} donor(s)</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</Spin>
				</Card>
			</div>
		</div>
	);
};

export default Page;
