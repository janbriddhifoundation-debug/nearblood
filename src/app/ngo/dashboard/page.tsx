"use client";

import Show from "@/components/Show";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {Card, message} from "antd";
import axios from "axios";
import Link from "next/link";
import React, {useEffect, useState} from "react";

const Page = () => {
	const [data, setData] = useState<{requestsCount: number; donorsCount: number} | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await axios.get(`/api/v1/ngo/dashboard`);
			setData(res.data);
		} catch (error) {
			// Sentry.captureException(error);
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<>
			<Show IF={loading}>
				<div>Loading...</div>
			</Show>

			<Show IF={!loading}>
				<div className="grid grid-cols-4 gap-6">
					<Link href="/ngo/requests">
						<Card title="Requests Overview">
							<div className="text-2xl font-medium ">Total: {data?.requestsCount} </div>
							<div className="mt-4 text-base text-gray-600">Manage Requests</div>
						</Card>
					</Link>
					<Link href="/ngo/donors">
						<Card title="Donor Management">
							<div className="text-2xl font-medium">Total: {data?.donorsCount} </div>
							<div className="mt-4 text-base text-gray-600">Manage Donors</div>
						</Card>
					</Link>
				</div>
			</Show>
		</>
	);
};

export default Page;
