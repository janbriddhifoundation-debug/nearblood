import { Button, Table } from "antd";
import React from "react";
import dayjs from "dayjs";
import Show from "./Show";

type Request = {
  key?: React.Key;
  photo?: string | null;
  patientName?: string;
  bloodGroup?: string;
  createdAt?: string;
  contact?: string;
  locationName?: string;
  lastActivity?: string;
  donors?: Record<string, unknown>[];
  [key: string]: unknown;
};

type NgoDonorsTableProps = {
  loading: boolean;
  requests: Request[];
  onViewDetailsClick: (request: Request) => void;
  onAssignDonorClick: (request: Request) => void; //myAdd
};

const NgoRequestsTable: React.FC<NgoDonorsTableProps> = ({
  loading,
  requests,
  onViewDetailsClick,
  onAssignDonorClick,
}) => {
  const dataSource = requests.map((item, i) => ({
    ...item,
    key: i,
  }));

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (createdAt: string) => (
        <span className="whitespace-nowrap">
          {dayjs(createdAt).format("D MMMM, YYYY")}
        </span>
      ),
    },
    {
      title: "Patient Name",
      dataIndex: "patientName",
      render: (patientName: string) => (
        <span className="whitespace-nowrap">{patientName}</span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Blood Group</span>,
      dataIndex: "bloodGroup",
      render: (bloodGroup: string) => (
        <span className="whitespace-nowrap">{bloodGroup}</span>
      ),
    },
    {
      title: "Urgency",
      dataIndex: "urgency",
      render: (urgency: string) => (
        <span className="whitespace-nowrap">{urgency}</span>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      render: (contact: string) => (
        <span className="whitespace-nowrap">{contact}</span>
      ),
    },
    {
      title: "Location",
      dataIndex: "locationName",
      render: (locationName: string) => (
        <div className="truncate max-w-[300px]">{locationName}</div>
      ),
    },
    {
      title: "Status",
      render: (value: unknown, record: Request) => {
        let color = "default";
        let text = "Unknown";
        switch (record.lastActivity) {
          case "REQUEST_SENT":
            color = "default";
            text = "Request Sent";
            break;
          case "REQUEST_CLOSED":
            color = "orange";
            text = "Request Closed";
            break;
          case "DONORS_ASSIGNED":
            color = "blue";
            text = "Donors Assigned";
            break;
          case "DONATION_PROOF_SUBMITTED":
            color = "green";
            text = "Proof Submitted";
            break;
          case "UNKNOWN":
            color = "gray";
            text = "Unknown";
            break;
        }

        return (
          <span style={{ color: color }} className="whitespace-nowrap">
            {text}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (value: unknown, record: Request) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => onViewDetailsClick(record)}>
            View Details
          </Button>
          <Show IF={record.lastActivity === "REQUEST_SENT"}>
            <Button
              size="small"
              type="primary"
              onClick={() => onAssignDonorClick(record)}
            >
              Assign Donor
            </Button>
          </Show>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border rounded-md border-gray-100 max-w-full overflow-x-auto">
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        loading={loading}
      />
    </div>
  );
};

export default NgoRequestsTable;
