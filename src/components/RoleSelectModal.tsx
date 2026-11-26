"use client";
import {Button, Modal, Select, message} from "antd";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {TRole} from "@/utils/roleRoutes";

interface RoleSelectModalProps {
	isOpen: boolean;
	defaultRole?: TRole;
	onRoleUpdated: (role: TRole) => void;
}

const ROLE_OPTIONS: {value: TRole; title: string; description: string}[] = [
	{value: "user", title: "🩸 Blood Requester", description: "Request blood for a patient"},
	{value: "donor", title: "❤️ Blood Donor", description: "Donate blood through a nearby NGO"},
	{value: "ngo", title: "🏥 NGO/Organization", description: "Provide blood donation services"},
];

const RoleSelectModal: React.FC<RoleSelectModalProps> = ({isOpen, defaultRole, onRoleUpdated}) => {
	const [selectedRole, setSelectedRole] = useState<TRole | undefined>(defaultRole);
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);

	useEffect(() => {
		if (defaultRole) setSelectedRole(defaultRole);
	}, [defaultRole]);

	const handleRoleUpdate = async () => {
		if (!selectedRole) return;

		try {
			setIsUpdatingRole(true);
			await axios.post("/api/auth/upsert-user", {role: selectedRole});
			onRoleUpdated(selectedRole);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setIsUpdatingRole(false);
		}
	};

	return (
		<Modal title={<div className="text-center text-lg font-semibold text-red-500 py-4">Welcome to NearBlood</div>} open={isOpen} closable={false} maskClosable={false} footer={null} width={450} centered>
			<div className="flex flex-col gap-5 px-2.5 py-5 text-center">
				<div className="mb-2.5">
					<p className="text-base text-gray-600 mb-2 leading-6 m-0">To get started, please select your role in our platform:</p>
					<p className="text-sm text-gray-400 m-0 italic">Requesters can become donors later, and donors can request blood too.</p>
				</div>

				<div className="flex flex-col gap-3.5 items-center">
					<Select
						placeholder="Choose your role..."
						className="w-full max-w-xs"
						size="large"
						value={selectedRole}
						onChange={setSelectedRole}
						optionLabelProp="label"
						options={ROLE_OPTIONS.map((option) => ({
							value: option.value,
							label: option.title,
							children: (
								<div className="py-2">
									<div className="font-medium text-sm">{option.title}</div>
									<div className="text-xs text-gray-400">{option.description}</div>
								</div>
							),
						}))}
					/>
					<Button type="primary" onClick={handleRoleUpdate} loading={isUpdatingRole} disabled={!selectedRole} size="large" className="w-full max-w-xs h-11 text-base font-medium rounded-lg">
						{isUpdatingRole ? "Setting up your account..." : "Continue"}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default RoleSelectModal;
