"use client";

import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Button, Empty, Input, Radio, Spin, Tag, message} from "antd";
import {CopyOutlined, EnvironmentOutlined, SearchOutlined, TeamOutlined, WhatsAppOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {NEARBY_NGO_RADIUS_KM} from "@/data/Donor";

export interface NearbyNgoRecord {
	id: string;
	name: string | null;
	type: string | null;
	address: string | null;
	regions: string | null;
	distanceKm: number | null;
}

interface NgoPickerProps {
	latitude?: number;
	longitude?: number;
	city?: string | null;
	// Full place name the donor picked, to match NGOs covering a whole district/state
	area?: string;
	value?: string;
	onChange: (organisationId: string) => void;
}

// Shown when no NGO covers the donor's area: lets them invite an NGO they know
function InviteNgoMessage({city}: {city?: string | null}) {
	const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/?intent=ngo` : "";
	const inviteText = `NearBlood connects blood donors with NGOs near them. Donors${city ? ` in ${city}` : ""} are looking for an NGO to donate through. Register your organisation for free: ${inviteUrl}`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(inviteText);
			message.success("Invite message copied");
		} catch {
			message.error("Could not copy. Please copy the link manually.");
		}
	};

	return (
		<div className="text-center rounded-xl border border-dashed border-red-200 bg-red-50 px-6 py-8">
			<div className="mx-auto mb-3 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-xl !text-red-500">
				<TeamOutlined />
			</div>
			<div className="font-semibold text-gray-900 text-lg">No NGO is working in your area yet</div>
			<p className="text-gray-600 mt-2 max-w-md mx-auto">
				Know a blood donation NGO, club or organisation{city ? ` in ${city}` : " near you"}? Ask them to sign up on NearBlood, then come back and pick them. You can also search for an NGO by name above.
			</p>
			<div className="flex flex-col sm:flex-row justify-center gap-3 mt-5">
				<a href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`} target="_blank" rel="noopener noreferrer">
					<Button type="primary" icon={<WhatsAppOutlined />} className="w-full">
						Invite via WhatsApp
					</Button>
				</a>
				<Button icon={<CopyOutlined />} onClick={handleCopy}>
					Copy invite message
				</Button>
			</div>
		</div>
	);
}

// Lists approved NGOs near the donor (within 25 km or in their city), with a name search across all approved NGOs
const NgoPicker: React.FC<NgoPickerProps> = ({latitude, longitude, city, area, value, onChange}) => {
	const [ngos, setNgos] = useState<NearbyNgoRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");

	const fetchNgos = useCallback(async () => {
		if (!search && !city && (latitude === undefined || longitude === undefined)) return;

		try {
			setLoading(true);
			const {data} = await axios.get("/api/v1/donor/nearby-ngos", {params: {lat: latitude, lon: longitude, city: city || undefined, area: area || undefined, search: search || undefined}});
			setNgos(data?.data ?? []);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoading(false);
		}
	}, [latitude, longitude, city, area, search]);

	useEffect(() => {
		void fetchNgos();
	}, [fetchNgos]);

	return (
		<div>
			<Input.Search
				placeholder="Search any registered NGO by name"
				prefix={<SearchOutlined />}
				allowClear
				value={searchInput}
				onChange={(e) => {
					setSearchInput(e.target.value);
					if (!e.target.value) setSearch("");
				}}
				onSearch={(val) => setSearch(val.trim())}
				className="mb-4"
			/>

			<div className="text-sm text-gray-500 mb-3">{search ? `Results for "${search}"` : `NGOs working within ${NEARBY_NGO_RADIUS_KM} km of you${city ? ` or in ${city}` : ""}`}</div>

			<Spin spinning={loading}>
				<Show IF={!loading && ngos.length === 0 && !!search}>
					<Empty description="No NGO found with that name" />
				</Show>
				<Show IF={!loading && ngos.length === 0 && !search}>
					<InviteNgoMessage city={city} />
				</Show>

				<Radio.Group value={value} onChange={(e) => onChange(e.target.value)} className="!w-full">
					<div className="flex flex-col gap-3">
						{ngos.map((ngo) => (
							<label
								key={ngo.id}
								className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${value === ngo.id ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}>
								<Radio value={ngo.id} className="!mt-1" />
								<div className="flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-semibold text-gray-900">{ngo.name}</span>
										<Show IF={!!ngo.type}>
											<Tag>{ngo.type}</Tag>
										</Show>
									</div>
									<Show IF={!!ngo.address}>
										<div className="text-sm text-gray-600 mt-1">{ngo.address}</div>
									</Show>
									<Show IF={!!ngo.regions}>
										<div className="text-xs text-gray-500 mt-1 truncate">Covers: {ngo.regions}</div>
									</Show>
								</div>
								<Show IF={ngo.distanceKm !== null}>
									<div className="flex items-center gap-1 text-sm font-medium text-red-600 whitespace-nowrap">
										<EnvironmentOutlined />
										{ngo.distanceKm} km
									</div>
								</Show>
							</label>
						))}
					</div>
				</Radio.Group>
			</Spin>
		</div>
	);
};

export default NgoPicker;
