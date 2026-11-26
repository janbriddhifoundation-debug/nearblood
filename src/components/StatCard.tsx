import React from "react";
import Link from "next/link";
import {Card} from "antd";

interface StatCardProps {
	icon: React.ReactNode;
	title: string;
	value: React.ReactNode;
	hint?: React.ReactNode;
	href?: string;
}

// Dashboard number tile: red icon circle, label, big value, optional hint. Clickable when href is given.
const StatCard: React.FC<StatCardProps> = ({icon, title, value, hint, href}) => {
	const card = (
		<Card className={`h-full !rounded-xl ${href ? "hover:!shadow-md transition-shadow" : ""}`} styles={{body: {padding: 20}}}>
			<div className="flex items-start gap-4">
				<div className="flex-none h-11 w-11 rounded-full bg-red-100 flex items-center justify-center text-lg !text-red-500">{icon}</div>
				<div className="min-w-0">
					<div className="text-sm text-gray-500">{title}</div>
					<div className="text-2xl md:text-3xl font-semibold text-gray-900 mt-0.5">{value}</div>
					{hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
				</div>
			</div>
		</Card>
	);

	return href ? (
		<Link href={href} className="block h-full">
			{card}
		</Link>
	) : (
		card
	);
};

export default StatCard;
