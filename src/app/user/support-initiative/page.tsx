"use client";

import {Button, Card, Image, message, Upload} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import type {UploadProps} from "antd";
import React from "react";

const props: UploadProps = {
	name: "file",
	action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
	headers: {
		authorization: "authorization-text",
	},
	onChange(info) {
		if (info.file.status !== "uploading") {
			console.log(info.file, info.fileList);
		}
		if (info.file.status === "done") {
			message.success(`${info.file.name} file uploaded successfully`);
		} else if (info.file.status === "error") {
			message.error(`${info.file.name} file upload failed.`);
		}
	},
};

const SupportInitiativePage = () => {
	return (
		<div style={{padding: 32, maxWidth: 1320, margin: "0 auto"}}>
			<Card>
				<div style={{padding: "20px", display: "flex", gap: "20px"}}>
					<div style={{width: "200px"}}>
						<Image src={"/upi.jpg"} alt="" style={{width: "100%"}} />
					</div>
					<div style={{flex: 1}}>
						<h1>Support the Floating Blood Bank - Be a Lifesaver!</h1>
						<div>{"Help us improve our technology, outreach, and support services."}</div>
						<div>{"Donate Today & Be Someone's Hero!"}</div>
						<div style={{marginTop: 20, marginBottom: 20}}>Scan the QR code and after payment please upload the screenshot</div>
						<Upload {...props} showUploadList={false}>
							<Button icon={<UploadOutlined />}>Click to Upload</Button>
						</Upload>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default SupportInitiativePage;
