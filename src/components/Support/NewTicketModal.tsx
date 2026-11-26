"use client";

import React from "react";
import axios from "axios";
import {useFormik} from "formik";
import {Input, Modal, Select, message} from "antd";
import {showValidationErrors} from "@/utils/showValidationErrors";
import {zodFormikValidate} from "@/utils/zodFormikValidate";
import {SUPPORT_CATEGORIES, supportTicketSchema, TSupportTicket} from "@/validationSchema/supportSchema";

interface NewTicketModalProps {
	open: boolean;
	onClose: () => void;
	onCreated: (ticketId: string) => void;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({open, onClose, onCreated}) => {
	const formik = useFormik<TSupportTicket>({
		initialValues: {subject: "", category: "", message: ""},
		validate: zodFormikValidate<TSupportTicket>(supportTicketSchema),
		onSubmit: async (values, {resetForm}) => {
			try {
				const {data} = await axios.post("/api/v1/support/tickets", values);
				message.success("Ticket raised. Our team will reply here.");
				resetForm();
				onCreated(data.ticket.id);
			} catch (error) {
				showValidationErrors(error);
			}
		},
	});

	const getError = (field: keyof TSupportTicket) => (formik.touched[field] && formik.errors[field] ? <div className="text-red-500 text-xs py-1">{formik.errors[field]}</div> : null);

	return (
		<Modal title="Raise a support ticket" open={open} onCancel={onClose} onOk={() => formik.handleSubmit()} okText="Submit" confirmLoading={formik.isSubmitting} destroyOnHidden>
			<div className="space-y-4 py-2">
				<div>
					<label className="block font-medium mb-1 text-gray-600">Category</label>
					<Select
						className="w-full"
						placeholder="What is this about?"
						value={formik.values.category || undefined}
						onChange={(value) => formik.setFieldValue("category", value)}
						onBlur={() => formik.setFieldTouched("category", true)}
						options={SUPPORT_CATEGORIES.map((category) => ({label: category, value: category}))}
					/>
					{getError("category")}
				</div>
				<div>
					<label className="block font-medium mb-1 text-gray-600">Subject</label>
					<Input name="subject" maxLength={150} placeholder="Short summary" value={formik.values.subject} onChange={formik.handleChange} onBlur={formik.handleBlur} />
					{getError("subject")}
				</div>
				<div>
					<label className="block font-medium mb-1 text-gray-600">Describe the problem</label>
					<Input.TextArea name="message" rows={5} maxLength={3000} showCount value={formik.values.message} onChange={formik.handleChange} onBlur={formik.handleBlur} />
					{getError("message")}
				</div>
			</div>
		</Modal>
	);
};

export default NewTicketModal;
