"use client";

import React, {useEffect, useState} from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import {signOut} from "next-auth/react";
import {Button, Card, Spin, Tag, message} from "antd";
import {ClockCircleOutlined, CloseCircleOutlined, FormOutlined, HeartOutlined, HomeOutlined, LogoutOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import {getErrorMessage} from "@/utils/getErrorMessage";

type TDonorOnboarding = {
	status: "PENDING" | "APPROVED" | "REJECTED";
	Organisation: {name: string | null} | null;
} | null;

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [donor, setDonor] = useState<TDonorOnboarding>(null);

	useEffect(() => {
		const fetchStatus = async () => {
			try {
				const {data} = await axios.get("/api/v1/donor/registration");
				setDonor(data?.donor ?? null);
			} catch (error) {
				message.error(getErrorMessage(error));
			} finally {
				setLoading(false);
			}
		};

		void fetchStatus();
	}, []);

	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				<Spin size="large" />
			</div>
		);
	}

	const isRejected = donor?.status === "REJECTED";
	const ngoName = donor?.Organisation?.name ?? "your NGO";

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="max-w-xl w-full !rounded-xl !shadow-lg text-center">
				<div className="flex justify-center mb-6">
					<Image src="/sitelogo.png" alt="NearBlood" width={200} height={100} className="w-[150px] object-contain" />
				</div>

				<div className={`mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center ${isRejected ? "bg-red-100" : "bg-amber-100"}`}>
					{isRejected ? <CloseCircleOutlined className="text-3xl !text-red-500" /> : <ClockCircleOutlined className="text-3xl !text-amber-500" />}
				</div>

				<Tag color={isRejected ? "red" : "gold"} className="!mb-3">
					{isRejected ? "Not approved" : "Waiting for approval"}
				</Tag>

				<h1 className="text-2xl font-bold text-gray-900 mb-2">{isRejected ? "Application not approved" : "Thanks for signing up to donate!"}</h1>

				<p className="text-gray-600 mb-6">
					{isRejected
						? `${ngoName} could not approve your donor application. You can apply again through another NGO near you.`
						: `Your details have been sent to ${ngoName}. They will verify them and may call you. Once approved, your donor dashboard will open here.`}
				</p>

				<div className="flex flex-col sm:flex-row justify-center gap-3">
					<Show IF={isRejected}>
						<Link href="/donor/registration">
							<Button type="primary" size="large" icon={<FormOutlined />} className="w-full">
								Apply to another NGO
							</Button>
						</Link>
					</Show>
					<Link href="/user/dashboard">
						<Button size="large" icon={<HeartOutlined />} className="w-full">
							Request blood
						</Button>
					</Link>
					<Link href="/">
						<Button size="large" icon={<HomeOutlined />} className="w-full">
							Home
						</Button>
					</Link>
					<Button size="large" icon={<LogoutOutlined />} onClick={() => signOut({callbackUrl: "/"})}>
						Logout
					</Button>
				</div>
			</Card>
		</div>
	);
};

export default Page;
