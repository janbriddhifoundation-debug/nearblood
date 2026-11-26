"use client";

import {HistoryIcon} from "@/components/Icons";
import RequestHistoryTable from "@/components/RequestHistoryTable";
import Show from "@/components/Show";
import {IBloodRequest} from "@/types/bloodRequestTypes";
import {Button, Empty, message, Steps} from "antd";
import axios from "axios";
import {useRouter} from "next/navigation";
import React, {useEffect, useState} from "react";

const UserDashboardView = () => {
	const router = useRouter();
	const [requests, setRequests] = useState<IBloodRequest[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchRequests = async () => {
		try {
			setLoading(true);
			const {data} = await axios.get(`/api/v1/user/requests`);
			setRequests(data.requests);
			console.log(data.requests);
		} catch (error) {
			console.log("Error fetching requests:", error);
			message.error("Failed to fetch requests. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const getCurrentStep = (status: string | undefined) => {
		switch (status) {
			case "REQUEST_SENT":
				return 1;
			case "DONORS_ASSIGNED":
				return 2;
			case "DONATION_PROOF_SUBMITTED":
				return 3;
			case "REQUEST_CLOSED":
				return 4;
			default:
				return -1;
		}
	};

	const stepsItems = [
		{
			title: "Request Sent",
			description: requests[0]?.id ? `#${requests[0]?.id}` : "",
		},
		{
			title: "Getting Matched",
			description: "Finding a Donor",
		},
		{
			title: "Donor Found",
			description: "Donor assigned",
		},
		{
			title: "Uploading proof",
			description: "Up next",
		},
	];

	useEffect(() => {
		fetchRequests();
	}, []);

	return (
		<div style={{background: "#fff", padding: 24}}>
			{/* Header */}
			<div className="mb-12">
				<h1 className="text-[#383435] flex items-center text-xl font-semibold">
					<HistoryIcon className="w-8 h-8 mr-2 -mb-1 -ml-2" stroke="red" />
					Requests Overview
				</h1>
				<h3 className="text-black/45 ml-[34px]">Follow the Status of your Current Request.</h3>
			</div>

			{/* Responsive Steps */}
			<div className="w-full">
				{/* Horizontal Steps */}
				<div className="hidden lg:block">
					<Steps direction="horizontal" current={getCurrentStep(requests[0]?.status)} items={stepsItems} />
				</div>

				{/* Vertical Steps */}
				<div className="lg:hidden mt-4">
					<Steps direction="vertical" current={getCurrentStep(requests[0]?.status)} items={stepsItems} />
				</div>
			</div>

			{/* Request History */}
			<div style={{marginBottom: "24px", marginTop: "48px"}}>
				<h2>Request history</h2>
				<hr
					style={{
						height: "1px",
						backgroundColor: "#d9d9d9",
						border: "none",
						marginBottom: "24px",
						marginTop: "8px",
					}}
				/>
			</div>

			<RequestHistoryTable requests={requests} loading={loading} />

			{/* Empty State */}
			<Show IF={requests.length === 0 && !loading}>
				<div style={{textAlign: "center", padding: "48px 0"}}>
					<Empty description={<span style={{fontSize: 16}}>No request history found</span>} styles={{image: {height: 80}}} />
					<Button
						type="primary"
						size="large"
						style={{
							marginTop: 24,
							backgroundColor: "#d72638",
							borderColor: "#d72638",
						}}
						onClick={() => router.push("/user/request")}>
						Send New Request
					</Button>
				</div>
			</Show>
		</div>
	);
};

export default UserDashboardView;
