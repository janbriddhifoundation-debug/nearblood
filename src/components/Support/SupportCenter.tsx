"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import {Avatar, Button, Card, Empty, Input, Popconfirm, Segmented, Select, Spin, Tag, message} from "antd";
import {ArrowLeftOutlined, CustomerServiceOutlined, PlusOutlined, SendOutlined} from "@ant-design/icons";
import Show from "@/components/Show";
import NewTicketModal from "@/components/Support/NewTicketModal";
import {getErrorMessage} from "@/utils/getErrorMessage";

type TTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const STATUS_TAGS: Record<TTicketStatus, {label: string; color: string}> = {
	OPEN: {label: "Open", color: "gold"},
	IN_PROGRESS: {label: "In progress", color: "processing"},
	RESOLVED: {label: "Resolved", color: "success"},
	CLOSED: {label: "Closed", color: "default"},
};

interface TicketListItem {
	id: string;
	subject: string;
	category: string;
	status: TTicketStatus;
	updatedAt: string;
	messageCount: number;
	raisedBy: {name: string | null; email: string; role: string | null; organisationName: string | null} | null;
}

interface TicketDetail {
	id: string;
	subject: string;
	category: string;
	status: TTicketStatus;
	createdAt: string;
	User: {name: string | null; email: string; role: string | null};
	Organisation: {id: string; name: string | null} | null;
	Messages: {id: string; message: string; isStaff: boolean; createdAt: string; User: {name: string | null; image: string | null}}[];
}

interface SupportCenterProps {
	mode: "user" | "admin";
}

// Ticket list + conversation. Users see their own tickets and can raise new ones; admins see everyone's and set status.
const SupportCenter: React.FC<SupportCenterProps> = ({mode}) => {
	const isAdmin = mode === "admin";
	const [loadingList, setLoadingList] = useState(true);
	const [tickets, setTickets] = useState<TicketListItem[]>([]);
	const [counts, setCounts] = useState<Partial<Record<TTicketStatus, number>>>({});
	const [statusFilter, setStatusFilter] = useState<string>(isAdmin ? "OPEN" : "ALL");
	const [search, setSearch] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [ticket, setTicket] = useState<TicketDetail | null>(null);
	const [loadingTicket, setLoadingTicket] = useState(false);
	const [reply, setReply] = useState("");
	const [sending, setSending] = useState(false);
	const [newTicketOpen, setNewTicketOpen] = useState(false);
	const threadEndRef = useRef<HTMLDivElement | null>(null);

	const fetchTickets = useCallback(async () => {
		try {
			setLoadingList(true);
			const {data} = await axios.get("/api/v1/support/tickets", {params: {status: statusFilter === "ALL" ? undefined : statusFilter, search: search || undefined}});
			setTickets(data?.data ?? []);
			setCounts(data?.counts ?? {});
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setLoadingList(false);
		}
	}, [statusFilter, search]);

	const fetchTicket = useCallback(async (id: string) => {
		try {
			setLoadingTicket(true);
			const {data} = await axios.get(`/api/v1/support/tickets/${id}`);
			setTicket(data?.ticket ?? null);
		} catch (error) {
			message.error(getErrorMessage(error));
			setTicket(null);
		} finally {
			setLoadingTicket(false);
		}
	}, []);

	useEffect(() => {
		void fetchTickets();
	}, [fetchTickets]);

	// Open the ticket named in ?ticket= (links from notifications)
	useEffect(() => {
		const ticketParam = new URLSearchParams(window.location.search).get("ticket");
		if (ticketParam) setSelectedId(ticketParam);
	}, []);

	useEffect(() => {
		if (!selectedId) {
			setTicket(null);
			return;
		}
		void fetchTicket(selectedId);
		const url = new URL(window.location.href);
		url.searchParams.set("ticket", selectedId);
		window.history.replaceState(null, "", url.toString());
	}, [selectedId, fetchTicket]);

	useEffect(() => {
		threadEndRef.current?.scrollIntoView({behavior: "smooth"});
	}, [ticket?.Messages.length]);

	const handleSendReply = async () => {
		if (!selectedId || !reply.trim()) return;

		try {
			setSending(true);
			await axios.post(`/api/v1/support/tickets/${selectedId}/messages`, {message: reply});
			setReply("");
			await Promise.all([fetchTicket(selectedId), fetchTickets()]);
		} catch (error) {
			message.error(getErrorMessage(error));
		} finally {
			setSending(false);
		}
	};

	const handleStatusChange = async (status: TTicketStatus) => {
		if (!selectedId) return;

		try {
			await axios.patch(`/api/v1/support/tickets/${selectedId}`, {status});
			message.success(`Ticket marked ${STATUS_TAGS[status].label.toLowerCase()}`);
			await Promise.all([fetchTicket(selectedId), fetchTickets()]);
		} catch (error) {
			message.error(getErrorMessage(error));
		}
	};

	const statusOptions = [{label: "All", value: "ALL"}, ...(Object.keys(STATUS_TAGS) as TTicketStatus[]).map((status) => ({label: `${STATUS_TAGS[status].label}${counts[status] ? ` (${counts[status]})` : ""}`, value: status}))];

	const list = (
		<Card className="!rounded-xl h-full" styles={{body: {padding: 0}}}>
			<div className="p-4 border-b border-gray-100 space-y-3">
				<div className="flex items-center justify-between gap-2">
					<span className="font-semibold">{isAdmin ? "All tickets" : "Your tickets"}</span>
					<Show IF={!isAdmin}>
						<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setNewTicketOpen(true)}>
							New ticket
						</Button>
					</Show>
				</div>
				<Show IF={isAdmin}>
					<Input.Search placeholder="Subject, name, email or NGO" allowClear onSearch={(value) => setSearch(value.trim())} />
				</Show>
				<div className="overflow-x-auto">
					<Segmented size="small" value={statusFilter} onChange={(value) => setStatusFilter(String(value))} options={statusOptions} />
				</div>
			</div>
			<Spin spinning={loadingList}>
				<Show IF={!loadingList && tickets.length === 0}>
					<div className="py-10">
						<Empty description={isAdmin ? "No tickets here" : "No tickets yet. Raise one if you need help."} />
					</div>
				</Show>
				<div className="max-h-[560px] overflow-y-auto">
					{tickets.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setSelectedId(item.id)}
							className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${selectedId === item.id ? "bg-red-50" : "hover:bg-gray-50"}`}>
							<div className="flex items-start justify-between gap-2">
								<span className="font-medium text-gray-900 line-clamp-1">{item.subject}</span>
								<Tag color={STATUS_TAGS[item.status].color} className="!m-0 flex-none">
									{STATUS_TAGS[item.status].label}
								</Tag>
							</div>
							<div className="text-xs text-gray-500 mt-1">
								{item.category} · {dayjs(item.updatedAt).format("DD MMM, hh:mm A")}
							</div>
							<Show IF={!!item.raisedBy}>
								<div className="text-xs text-gray-500 mt-0.5 truncate">
									{item.raisedBy?.organisationName ?? item.raisedBy?.name ?? item.raisedBy?.email} · <span className="capitalize">{item.raisedBy?.role ?? "user"}</span>
								</div>
							</Show>
						</button>
					))}
				</div>
			</Spin>
		</Card>
	);

	const thread = (
		<Card className="!rounded-xl h-full" styles={{body: {padding: 0}}}>
			<Show IF={!selectedId}>
				<div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-500 gap-3 p-8 text-center">
					<CustomerServiceOutlined className="text-4xl !text-red-400" />
					<span>{isAdmin ? "Select a ticket to read and reply." : "Select a ticket, or raise a new one if you need help from the NearBlood team."}</span>
				</div>
			</Show>

			<Show IF={!!selectedId}>
				<Spin spinning={loadingTicket}>
					<div className="p-4 border-b border-gray-100">
						<Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => setSelectedId(null)} className="lg:!hidden !mb-2">
							Back
						</Button>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="font-semibold text-lg text-gray-900">{ticket?.subject}</div>
								<div className="text-xs text-gray-500">
									{ticket?.category} · opened {ticket ? dayjs(ticket.createdAt).format("DD MMM YYYY") : ""}
									{isAdmin && ticket ? ` · ${ticket.Organisation?.name ?? ticket.User.name ?? ticket.User.email} (${ticket.User.email})` : ""}
								</div>
							</div>
							<Show IF={isAdmin && !!ticket}>
								<Select size="small" className="w-[150px]" value={ticket?.status} onChange={handleStatusChange} options={(Object.keys(STATUS_TAGS) as TTicketStatus[]).map((status) => ({label: STATUS_TAGS[status].label, value: status}))} />
							</Show>
							<Show IF={!isAdmin && !!ticket && ticket.status !== "CLOSED"}>
								<Popconfirm title="Close this ticket?" description="You can raise a new one any time." onConfirm={() => handleStatusChange("CLOSED")}>
									<Button size="small">Close ticket</Button>
								</Popconfirm>
							</Show>
							<Show IF={!isAdmin && ticket?.status === "CLOSED"}>
								<Tag>Closed</Tag>
							</Show>
						</div>
					</div>

					<div className="p-4 space-y-4 max-h-[440px] overflow-y-auto bg-gray-50">
						{ticket?.Messages.map((item) => {
							const isMine = isAdmin ? item.isStaff : !item.isStaff;
							return (
								<div key={item.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
									<Avatar size="small" src={item.User.image || undefined} className={item.isStaff ? "!bg-red-500" : ""}>
										{item.User.name?.charAt(0)}
									</Avatar>
									<div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMine ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
										<div className={`text-xs mb-1 ${isMine ? "text-red-100" : "text-gray-500"}`}>
											{item.isStaff ? "NearBlood support" : item.User.name} · {dayjs(item.createdAt).format("DD MMM, hh:mm A")}
										</div>
										<div className="text-sm whitespace-pre-line break-words">{item.message}</div>
									</div>
								</div>
							);
						})}
						<div ref={threadEndRef} />
					</div>

					<Show IF={!!ticket && ticket.status !== "CLOSED"}>
						<div className="p-4 border-t border-gray-100 flex gap-2 items-end">
							<Input.TextArea
								value={reply}
								onChange={(e) => setReply(e.target.value)}
								placeholder={isAdmin ? "Reply to this person" : "Add a reply"}
								autoSize={{minRows: 2, maxRows: 6}}
								maxLength={3000}
								onPressEnter={(e) => {
									if (!e.shiftKey) {
										e.preventDefault();
										void handleSendReply();
									}
								}}
							/>
							<Button type="primary" icon={<SendOutlined />} loading={sending} disabled={!reply.trim()} onClick={handleSendReply} aria-label="Send reply" />
						</div>
					</Show>
				</Spin>
			</Show>
		</Card>
	);

	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				<div className={`lg:col-span-2 ${selectedId ? "hidden lg:block" : ""}`}>{list}</div>
				<div className={`lg:col-span-3 ${selectedId ? "" : "hidden lg:block"}`}>{thread}</div>
			</div>

			<NewTicketModal
				open={newTicketOpen}
				onClose={() => setNewTicketOpen(false)}
				onCreated={(id) => {
					setNewTicketOpen(false);
					setStatusFilter("ALL");
					setSelectedId(id);
					void fetchTickets();
				}}
			/>
		</>
	);
};

export default SupportCenter;
