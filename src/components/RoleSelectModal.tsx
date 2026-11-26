"use client";
import {Button, Modal, Select} from "antd";
import React, {useState} from "react";
import axios from "axios";

interface RoleSelectModalProps {
	isOpen: boolean;
	userEmail?: string | null;
	userName?: string | null;
    userImage?: string | null;
	onRoleUpdated: () => void;
}

const RoleSelectModal: React.FC<RoleSelectModalProps> = ({isOpen, userEmail, userName, userImage, onRoleUpdated}) => {
	const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);

	const handleRoleUpdate = async () => {
		if (!selectedRole || !userEmail) return;

		setIsUpdatingRole(true);
		try {
			const response = await axios.post("/api/auth/upsert-user", {
				email: userEmail,
				role: selectedRole,
                name: userName,
                image: userImage,
			});

			if (response.status === 200) {
				onRoleUpdated();
			}
		} catch (error) {
			console.error("Error updating role:", error);
		} finally {
			setIsUpdatingRole(false);
		}
	};

	return (
		<Modal title={<div className="text-center text-lg font-semibold text-red-500 py-4">Welcome to Blood Donation Platform</div>} open={isOpen} closable={false} maskClosable={false} footer={null} width={450} centered>
			<div className="flex flex-col gap-5 px-2.5 py-5 text-center">
				<div className="mb-2.5">
					<p className="text-base text-gray-600 mb-2 leading-6 m-0">To get started, please select your role in our platform:</p>
					<p className="text-sm text-gray-400 m-0 italic">This will help us customize your experience</p>
				</div>

				<div className="flex flex-col gap-3.5 items-center">
					<Select
						placeholder="Choose your role..."
						className="w-full max-w-xs"
						size="large"
						value={selectedRole}
						onChange={setSelectedRole}
						optionLabelProp="label"
						options={[
							{
								value: "user",
								label: "🩸 Blood Requester",
								children: (
									<div className="py-2">
										<div className="font-medium text-sm">🩸 Blood Requester</div>
										<div className="text-xs text-gray-400">Request blood donations</div>
									</div>
								),
							},
							{
								value: "ngo",
								label: "🏥 NGO/Organization",
								children: (
									<div className="py-2">
										<div className="font-medium text-sm">🏥 NGO/Organization</div>
										<div className="text-xs text-gray-400">Provide blood donation services</div>
									</div>
								),
							},
						]}
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
