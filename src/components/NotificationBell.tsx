"use client";

import React from "react";
import {Badge, Button, Empty, Popover} from "antd";
import {BellOutlined} from "@ant-design/icons";

// Header bell for all dashboards. Shows an empty state until the notification service (roadmap Phase 3) exists.
const NotificationBell = () => {
	const content = (
		<div className="w-[280px] py-2">
			<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications yet" />
		</div>
	);

	return (
		<Popover content={content} title="Notifications" trigger="click" placement="bottomRight">
			<Badge count={0}>
				<Button type="text" shape="circle" aria-label="Notifications" icon={<BellOutlined className="text-xl" />} />
			</Badge>
		</Popover>
	);
};

export default NotificationBell;
