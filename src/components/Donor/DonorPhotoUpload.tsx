"use client";

import React, {useState} from "react";
import {Avatar, Button, Upload, UploadProps, message} from "antd";
import {UploadOutlined, UserOutlined} from "@ant-design/icons";

interface DonorPhotoUploadProps {
	currentUrl?: string | null;
	onUploaded: (filekey: string) => void;
}

// Uploads a donor photo to R2 (donors/ folder) and hands back the file key
const DonorPhotoUpload: React.FC<DonorPhotoUploadProps> = ({currentUrl, onUploaded}) => {
	const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
	const [uploading, setUploading] = useState(false);

	const uploadProps: UploadProps = {
		name: "file",
		multiple: false,
		showUploadList: false,
		accept: ".jpg,.jpeg,.png,.webp",
		action: "/api/v1/upload-file",
		data: {type: "TEMP_DONOR_PHOTO"},
		beforeUpload(file) {
			const isUnder5Mb = file.size / 1024 / 1024 < 5;
			if (!isUnder5Mb) message.error("Photo must be smaller than 5MB");
			return isUnder5Mb || Upload.LIST_IGNORE;
		},
		onChange(info) {
			const {status, response} = info.file;
			setUploading(status === "uploading");

			if (status === "done" && response?.filekey) {
				setPreviewUrl(response.url);
				onUploaded(response.filekey);
			} else if (status === "error") {
				message.error(`${info.file.name} upload failed.`);
			}
		},
	};

	return (
		<div className="flex items-center gap-4">
			<Avatar size={64} src={previewUrl || undefined} icon={<UserOutlined />} alt="Donor photo" />
			<Upload {...uploadProps}>
				<Button icon={<UploadOutlined />} loading={uploading}>
					{previewUrl ? "Change photo" : "Upload photo"}
				</Button>
			</Upload>
		</div>
	);
};

export default DonorPhotoUpload;
