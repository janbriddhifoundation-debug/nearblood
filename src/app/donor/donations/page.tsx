"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Card, message} from "antd";
import DonorDonationsTable from "@/components/Donor/DonorDonationsTable";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {IDonorDonation} from "@/types/donorTypes";

const Page = () => {
	const [loading, setLoading] = useState(true);
	const [donations, setDonations] = useState<IDonorDonation[]>([]);

	const fetchDonations = useCallback(async () => {
		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/donor/donations");
			setDonations(data?.data ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDonations();
	}, [fetchDonations]);

	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			<div className="text-2xl font-semibold mb-2">My donations</div>
			<div className="text-sm text-gray-600 mb-8">Every request your NGO called you for, and the ones you completed.</div>

			<Card className="!rounded-xl">
				<DonorDonationsTable data={donations} loading={loading} />
			</Card>
		</div>
	);
};

export default Page;
