"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "next/navigation";
import {Spin, message} from "antd";
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
			const {data} = await axios.get(`/api/v1/ngo/certificate-management/${id}`);
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

	if (loading) {
		return (
			<div className="h-[70vh] flex items-center justify-center">
				<Spin size="large" />
			</div>
		);
	}

	if (!certificate) {
		return <div className="h-[70vh] flex items-center justify-center">Certificate not found.</div>;
	}

	return <DonationCertificateView donorName={certificate.donorName} certificateNumber={certificate.certificateNumber} generatedAt={certificate.generatedAt} />;
};

export default Page;
