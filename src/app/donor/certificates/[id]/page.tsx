"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import Link from "next/link";
import {useParams} from "next/navigation";
import {Button, Spin, message} from "antd";
import {ArrowLeftOutlined} from "@ant-design/icons";
import DonationCertificateView from "@/components/DonationCertificateView";
import {getErrorMessage} from "@/utils/getErrorMessage";

type CertificateData = {
	certificateNumber: string;
	generatedAt: string;
	donorName: string;
};

const Page = () => {
	const {id} = useParams<{id: string}>();
	const [loading, setLoading] = useState(true);
	const [certificate, setCertificate] = useState<CertificateData | null>(null);

	const fetchCertificate = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get(`/api/v1/donor/certificates/${id}`);
			setCertificate(data?.certificate ?? null);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		if (id) void fetchCertificate();
	}, [id, fetchCertificate]);

	return (
		<div className="py-4">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
				<Link href="/donor/certificates">
					<Button icon={<ArrowLeftOutlined />}>All certificates</Button>
				</Link>
			</div>

			{loading ? (
				<div className="h-[60vh] flex items-center justify-center">
					<Spin size="large" />
				</div>
			) : certificate ? (
				<DonationCertificateView donorName={certificate.donorName} certificateNumber={certificate.certificateNumber} generatedAt={certificate.generatedAt} />
			) : (
				<div className="h-[60vh] flex items-center justify-center text-gray-500">Certificate not found.</div>
			)}
		</div>
	);
};

export default Page;
