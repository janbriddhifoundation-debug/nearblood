"use client";

import React from "react";
import {Modal, Button} from "antd";
import styled from "styled-components";
import {useRouter} from "next/navigation";

interface ModalProps {
	open: boolean;
	onCancel: () => void;
	onSeeOverview: () => void;
}

const StyledModal = styled(Modal)`
	.ant-modal-content {
		padding: 32px 24px;
	}

	.ant-modal-footer {
		display: none;
	}
`;

const Title = styled.h2`
	font-size: 32px;
	font-weight: 700;
	text-align: center;
	margin-bottom: 16px;
`;

const Text = styled.p`
	font-size: 18px;
	font-weight: 500;
	color: rgba(0, 0, 0, 0.6);
	text-align: center;
	max-width: 680px;
	margin: 0 auto 32px;
`;

const ButtonGroup = styled.div`
	display: flex;
	justify-content: center;
	gap: 16px;
`;

const ApprovalWaitingModal: React.FC<ModalProps> = ({open, onCancel, onSeeOverview}) => {
	const router = useRouter();
	return (
		<StyledModal open={open} onCancel={onCancel} footer={null} centered width={800} closable={false} maskClosable={false}>
			<Title>Waiting for Approval</Title>
			<Text>
				Thanks for your Request, Approval is pending, you will soon get a Donor!
				<br />
				Our Team will send you a Notification when they find a Match.
			</Text>
			<ButtonGroup>
				<Button size="large" onClick={() => router.push("/user/dashboard")}>
					Back to Dashboard
				</Button>
				<Button size="large" type="primary" style={{background: "#d72638", borderColor: "#d72638"}} onClick={onSeeOverview}>
					See Request Overview
				</Button>
			</ButtonGroup>
		</StyledModal>
	);
};

export default ApprovalWaitingModal;
