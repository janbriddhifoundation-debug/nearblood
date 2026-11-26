"use client";

import {ClockCircleOutlined, HomeOutlined, MailOutlined} from "@ant-design/icons";
import {Button} from "antd";
import React from "react";
import {useRouter} from "next/navigation";

const Page: React.FC = () => {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<main className="relative z-10 max-w-4xl w-full bg-white shadow-2xl rounded-3xl p-8 md:p-12 border border-transparent ring-1 ring-amber-50">
				<div className="flex items-center justify-between mb-6 relative">
					<div>
						<h1 className="text-2xl md:text-3xl font-extrabold text-rose-700 tracking-tight">Account Awaiting Approval</h1>
						<p className="mt-1 text-sm md:text-base text-slate-600 max-w-2xl">Thank you for registering your organisation with NearBlood. Your account is currently under review — this helps us keep the platform secure and trustworthy.</p>
					</div>
					<div className="absolute right-0 top-3">
						<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">Under review</span>
					</div>
				</div>

				<div className="flex flex-col md:flex-row items-start gap-8">
					<div className="flex-shrink-0">
						<div className="w-36 h-36 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center border border-gray-100">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9A3412" className="w-20 h-20" aria-hidden>
								<path d="M12 2v6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
								<path d="M5 11a7 7 0 1114 0v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
								<path d="M8 16h8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
					</div>

					<section className="flex-1">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="p-4 rounded-2xl bg-gradient-to-tr from-white to-rose-50 border border-gray-100">
								<div className="flex items-center gap-3">
									<div className="flex-none w-10 h-10 grid place-items-center rounded-lg bg-rose-600 text-white font-semibold">
										<MailOutlined />
									</div>
									<div>
										<p className="font-semibold text-slate-800">Check your email</p>
										<p className="text-sm text-slate-600">We will send a confirmation when your account is approved. Please watch for emails from our team.</p>
									</div>
								</div>
							</div>

							<div className="p-4 rounded-2xl bg-gradient-to-tr from-white to-amber-50 border border-gray-100">
								<div className="flex items-center gap-3">
									<div className="flex-none w-10 h-10 grid place-items-center rounded-lg bg-amber-500 text-white font-semibold">
										<ClockCircleOutlined />
									</div>
									<div>
										<p className="font-semibold text-slate-800">Approval timeframe</p>
										<p className="text-sm text-slate-600">Reviews typically complete within 1–3 business days; complex cases may take longer.</p>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-6 text-sm text-slate-500">
							<p>If you need an expedited review, contact support and include verification documents and your organisation name. You can continue exploring public resources while you wait.</p>
						</div>

						<div className="mt-6 flex flex-col sm:flex-row gap-3">
							<Button icon={<HomeOutlined />} type="primary" size="large" className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 w-full sm:w-auto" onClick={() => router.push("/")}>
								Home
							</Button>

							<Button icon={<MailOutlined />} type="default" size="large" className="rounded-xl w-full sm:w-auto" onClick={() => undefined}>
								Contact support
							</Button>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
};

export default Page;
