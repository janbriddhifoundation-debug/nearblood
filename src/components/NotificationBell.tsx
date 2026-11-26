"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {useRouter} from "next-nprogress-bar";
import {Badge, Button, Empty, Popover, Spin} from "antd";
import {BellOutlined} from "@ant-design/icons";
import Show from "@/components/Show";

dayjs.extend(relativeTime);

const POLL_INTERVAL_MS = 60 * 1000;

interface NotificationRecord {
	id: string;
	type: string;
	title: string;
	message: string;
	link: string | null;
	readAt: string | null;
	createdAt: string;
}

// Header bell for every dashboard: latest 20 notifications, polled every minute
const NotificationBell = () => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchNotifications = useCallback(async () => {
		try {
			const {data} = await axios.get("/api/v1/notifications");
			setNotifications(data?.data ?? []);
			setUnreadCount(data?.unreadCount ?? 0);
		} catch {
			// Background refresh - stay quiet on failure
		}
	}, []);

	useEffect(() => {
		void fetchNotifications();
		const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [fetchNotifications]);

	const markRead = async (ids?: string[]) => {
		await axios.patch("/api/v1/notifications", ids ? {ids} : {});
		setNotifications((prev) => prev.map((item) => (!ids || ids.includes(item.id) ? {...item, readAt: item.readAt ?? new Date().toISOString()} : item)));
		setUnreadCount((prev) => (ids ? Math.max(prev - ids.length, 0) : 0));
	};

	const handleOpenChange = async (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (nextOpen) {
			setLoading(true);
			await fetchNotifications();
			setLoading(false);
		}
	};

	const handleClick = async (item: NotificationRecord) => {
		if (!item.readAt) void markRead([item.id]);
		if (item.link) {
			setOpen(false);
			router.push(item.link);
		}
	};

	const content = (
		<div className="w-[320px] max-w-[85vw]">
			<Spin spinning={loading}>
				<Show IF={notifications.length === 0}>
					<div className="py-4">
						<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications yet" />
					</div>
				</Show>
				<div className="max-h-[420px] overflow-y-auto -mx-1">
					{notifications.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => handleClick(item)}
							className={`w-full text-left flex gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-gray-50 ${item.link ? "cursor-pointer" : "cursor-default"}`}>
							<span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${item.readAt ? "bg-transparent" : "bg-red-500"}`} aria-hidden />
							<span className="min-w-0">
								<span className={`block text-sm ${item.readAt ? "text-gray-700" : "font-semibold text-gray-900"}`}>{item.title}</span>
								<span className="block text-xs text-gray-500 mt-0.5">{item.message}</span>
								<span className="block text-xs text-gray-400 mt-1">{dayjs(item.createdAt).fromNow()}</span>
							</span>
						</button>
					))}
				</div>
			</Spin>
		</div>
	);

	return (
		<Popover
			content={content}
			title={
				<div className="flex items-center justify-between">
					<span>Notifications</span>
					<Show IF={unreadCount > 0}>
						<Button type="link" size="small" onClick={() => markRead()}>
							Mark all as read
						</Button>
					</Show>
				</div>
			}
			trigger="click"
			placement="bottomRight"
			open={open}
			onOpenChange={handleOpenChange}>
			<Badge count={unreadCount} size="small" offset={[-4, 4]}>
				<Button type="text" shape="circle" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} icon={<BellOutlined className="text-xl" />} />
			</Badge>
		</Popover>
	);
};

export default NotificationBell;
