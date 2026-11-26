"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import {Button, Card, Empty, Spin, message} from "antd";
import {EyeOutlined, SafetyCertificateOutlined, SafetyOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {IDonorDonation} from "@/types/donorTypes";

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [certified, setCertified] = useState<IDonorDonation[]>([]);

	const fetchCertificates = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/donor/donations");
			setCertified(((data?.data ?? []) as IDonorDonation[]).filter((item) => !!item.certificate));
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchCertificates();
	}, [fetchCertificates]);

	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			<div className="text-2xl font-semibold mb-2">Certificates</div>
			<div className="text-sm text-gray-600 mb-8">Your NGO issues a certificate after each verified donation. Anyone can check it by scanning its QR code.</div>

			<Spin spinning={loading}>
				<Show IF={!loading && certified.length === 0}>
					<Card className="!rounded-xl">
						<Empty description="No certificates yet. They appear here after your first verified donation." />
					</Card>
				</Show>

				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
					{certified.map((item) => (
						<Card key={item.id} className="!rounded-xl hover:!shadow-lg transition-shadow">
							<div className="flex items-start gap-4">
								<div className="flex-none h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-xl !text-red-500">
									<SafetyCertificateOutlined />
								</div>
								<div className="min-w-0">
									<div className="font-semibold text-gray-900">{item.certificate?.certificateNumber}</div>
									<div className="text-sm text-gray-600">{item.certificate?.generatedAt ? dayjs(item.certificate.generatedAt).format("DD MMM YYYY") : "-"}</div>
									<div className="text-xs text-gray-500 mt-1 truncate">
										{item.hospital || "-"} · {item.organisationName || "-"}
									</div>
								</div>
							</div>
							<div className="flex gap-2 mt-4">
								<Link href={`/donor/certificates/${item.id}`}>
									<Button type="primary" size="small" icon={<EyeOutlined />}>
										View & download
									</Button>
								</Link>
								<Link href={`/view-certificate/${encodeURIComponent(item.certificate?.certificateNumber ?? "")}`} target="_blank">
									<Button size="small" icon={<SafetyOutlined />}>
										Verify
									</Button>
								</Link>
							</div>
						</Card>
					))}
				</div>
			</Spin>
		</div>
	);
};

export default Page;
