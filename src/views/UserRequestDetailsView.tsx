"use client";

import Show from "@/components/Show";
import {IBloodRequest} from "@/types/bloodRequestTypes";
import {LeftOutlined, UserOutlined} from "@ant-design/icons";
import {Alert, Avatar, Badge, Button, Card, Divider, Image, Tag} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import {useRouter} from "next/navigation";
import React, {useCallback, useEffect, useState} from "react";

const Box = ({label, value}: {label: string; value: string | React.ReactNode}) => (
	<div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col">
		<span className="text-sm text-gray-600 font-semibold">{label}</span>
		<span className="text-sm md:text-base font-medium text-gray-900 mt-1 min-h-[20px]">{value ?? "-"}</span>
	</div>
);

const UserRequestDetailsView = ({id}: {id: string}) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [requestData, setRequestData] = useState<IBloodRequest>({} as IBloodRequest);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const res = await axios.get(`/api/v1/user/requests/${id}`);
			setRequestData(res.data.request);
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return (
			<div className="mx-auto">
				<h2>Loading...</h2>
			</div>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center w-full mb-8">
				<div className="flex flex-col md:flex-row items-start md:items-center md:gap-4 flex-wrap">
					<div className="font-semibold text-md md:text-lg">Request Details (#{requestData.id})</div>

					<div>
						<Show IF={requestData?.status === "REQUEST_SENT"}>
							<Badge status="warning" text={<>Finding donor</>} />
						</Show>
						<Show IF={requestData?.status === "DONORS_ASSIGNED"}>
							<Badge status="processing" text={<>Donors Assigned</>} />
						</Show>
						<Show IF={requestData?.status === "REQUEST_CLOSED"}>
							<Badge status="success" text={<>Request Closed</>} />
						</Show>
					</div>
				</div>

				<Button icon={<LeftOutlined />} onClick={() => router.back()}>
					<span className="hidden md:block">Back to History</span>
				</Button>
			</div>

			{/* Patient Information */}
			<Divider orientation="left">Patient Information</Divider>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Box label="Patient Name" value={requestData.patientName} />
				<Box label="Relation with Requester" value={requestData.relWRequester} />
			</div>

			<div className="grid grid-cols-2 gap-4 mt-4">
				<Box label="Age" value={requestData.age} />
				<Box label="Gender" value={requestData.gender} />
			</div>

			<div className="mt-4">
				<Box label="Address" value={requestData.patientAddress} />
			</div>

			{/* Hospital & Blood Details */}
			<Divider orientation="left" className="mt-8">
				Hospital & Blood Details
			</Divider>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Box label="Hospital Name" value={requestData.hospital} />
				<Box label="Hospital Reg. No" value={requestData.hospitalRegNo} />
			</div>

			<div className="grid grid-cols-2 gap-4 mt-4">
				<Box label="Blood Group" value={requestData.bloodGroup} />
				<Box label="Units Required" value={requestData.units} />
			</div>

			<div className="mt-4">
				<Box label="Urgency Level" value={<Tag color={requestData.urgency === "high" ? "red" : "orange"}>{requestData.urgency}</Tag>} />
			</div>

			<div className="mt-4">
				<Box label="Reason" value={requestData.reason} />
			</div>

			{/* Timing & Contact */}
			<Divider orientation="left" className="mt-8">
				Timing & Contact
			</Divider>

			<div className="grid grid-cols-2 gap-4">
				<Box label="Date of Requirement" value={requestData.requirementDate ? dayjs(requestData.requirementDate).format("D MMM YYYY") : "-"} />
				<Box label="Time of Requirement" value={requestData.requirementDate ? dayjs(requestData.requirementDate).format("h:mm A") : "-"} />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
				<Box label="Contact Number" value={requestData.contact} />
				<Box label="Location" value={requestData.locationName} />
			</div>

			{/* Notes */}
			<Show IF={!!requestData.notes}>
				<Divider orientation="left" className="mt-8">
					Additional Notes
				</Divider>
				<Card type="inner" size="small">
					{requestData.notes}
				</Card>
			</Show>

			{/* Donors */}
			<Divider orientation="left" className="mt-8">
				Donors
			</Divider>

			{requestData.RequestDonors?.map((item, idx) => (
				<Card type="inner" key={idx} className="mb-3">
					<div className="flex flex-col md:flex-row justify-between gap-4">
						<div className="flex items-center gap-3">
							<Avatar shape="square" size={40} src={item?.Donor?.photo || undefined} icon={<UserOutlined />} />
							<div>
								<div className="font-semibold text-sm text-gray-800">
									{item?.Donor?.name} • <span className="text-red-500">{item?.Donor?.bloodGroup}</span>
								</div>
								<div className="text-xs text-gray-500">
									Phone: {item?.Donor?.phone} • {item?.Donor?.address}
								</div>
							</div>
						</div>

						<div className="md:text-right">
							<div className="font-semibold text-sm text-gray-800">{item?.Organisation?.name}</div>
							<div className="text-xs text-gray-500">{item?.Organisation?.address}</div>
						</div>
					</div>
				</Card>
			))}

			{/* Donation Proof */}
			<Divider orientation="left" className="mt-8">
				Blood Donation Proof
			</Divider>

			<Show IF={!!requestData.DonationProof?.length}>
				<Card type="inner" size="small">
					<div className="flex gap-4 flex-wrap">
						{requestData.DonationProof?.map((item) => (
							<Image key={item.url} width={150} src={item.url} alt="donation proof" className="rounded" />
						))}
					</div>
				</Card>
			</Show>

			<Show IF={!requestData.DonationProof?.length}>
				<Alert message="No donation proof available" type="info" className="mt-4" />
			</Show>

			{/* Feedback */}
			<Show IF={!!requestData.feedback}>
				<Divider orientation="left" className="mt-8">
					User Feedback
				</Divider>
				<Card type="inner" size="small">
					{requestData.feedback}
				</Card>
			</Show>
		</div>
	);
};

export default UserRequestDetailsView;
