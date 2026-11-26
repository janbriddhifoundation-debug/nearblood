"use client";

import {getErrorMessage} from "@/utils/getErrorMessage";
import {Input, message} from "antd";
import axios from "axios";
import React, {useEffect, useState, useCallback} from "react";
import {debounce} from "lodash";
// import * as Sentry from "@sentry/nextjs";
import NgoRequestsTable from "@/components/NgoRequestsTable";
import RequestDetailsModal from "@/components/RequestDetailsModal";
import AssignDonorModal from "@/components/AssignDonorModal";

const Page = () => {
	const [loading, setLoading] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
	const [isRequestDetailsModalOpen, setRequestDetailsModalOpen] = useState(false);
	const [requestDetailsModalData, setRequestDetailsModalData] = useState<Record<string, unknown> | null>(null);
	const [isAssignDonorModalOpen, setIsAssignDonorModalOpen] = useState(false);
	const [assignDonorModalData, setAssignDonorModalData] = useState<Record<string, unknown> | null>(null);

	// Debounced search value using lodash.debounce
	const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSetSearchValue = useCallback(
		debounce((val: string) => {
			setDebouncedSearchValue(val);
		}, 500),
		[],
	);

	const fetchRequests = async (search: string) => {
		try {
			setLoading(true);
			const url = search ? `/api/v1/ngo/requests?search=${encodeURIComponent(search)}` : `/api/v1/ngo/requests`;
			const {data} = await axios.get(url);
			setRequests(data?.requests);
		} catch (error) {
			// Sentry.captureException(error);
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		debouncedSetSearchValue(searchValue);
		return () => {
			debouncedSetSearchValue.cancel();
		};
	}, [searchValue, debouncedSetSearchValue]);

	useEffect(() => {
		fetchRequests(debouncedSearchValue);
	}, [debouncedSearchValue]);

	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<div className="text-2xl font-semibold mb-5">Requests Overview</div>
			<div className="text-sm leading-[22px] text-gray-600 mb-10">
				This page contains blood requests from your nearest locations.
				<br />
				If you have donors available for the requested blood group, assign him & contact the requester!{" "}
			</div>

			<div className="flex flex-wrap gap-2 mb-6 items-center">
				<Input placeholder="Search patient" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} allowClear className="!w-[250px]" />
			</div>

			<NgoRequestsTable
				loading={loading}
				requests={requests}
				onViewDetailsClick={(request) => {
					setRequestDetailsModalData(request);
					setRequestDetailsModalOpen(true);
				}}
				onAssignDonorClick={(request) => {
					setAssignDonorModalData(request);
					setIsAssignDonorModalOpen(true);
				}}
			/>
			<RequestDetailsModal
				data={requestDetailsModalData}
				isModalOpen={isRequestDetailsModalOpen}
				handleCancel={() => {
					setRequestDetailsModalOpen(false);
					setRequestDetailsModalData(null);
				}}
			/>
			<AssignDonorModal
				requestData={assignDonorModalData}
				isModalOpen={isAssignDonorModalOpen}
				handleCancel={() => {
					setIsAssignDonorModalOpen(false);
					setAssignDonorModalData(null);
				}}
			/>
		</div>
	);
};

export default Page;
