"use client";

import React from "react";
import { Button, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

type Donor = {
  photo?: string | null;
  name?: string;
  bloodGroup?: string;
  phone?: string;
  address?: string;
};

type RequestDetailsData = {
  id?: string | number;
  patientName?: string;
  age?: number;
  gender?: string;
  patientAddress?: string;
  bloodGroup?: string;
  units?: number;
  urgency?: string;
  relWRequester?: string;
  notes?: string;
  hospital?: string;
  hospitalRegNo?: string;
  locationName?: string;
  reason?: string;
  requirementDate?: string;
  createdAt?: string;
  contact?: string;
  donors?: Donor[];
};

export interface ReportAnalyticsRecord {
  id: string;

  assignedAt: string;

  assignedAtFormatted: string;

  patientName: string;

  donorName: string;

  bloodGroup: string;

  requestContact: string;

  status: "DONOR_ASSIGNED" | "REQUEST_CLOSED";

  request: RequestDetailsData;
}

interface ReportAnalyticsTableProps {
  loading?: boolean;

  data: ReportAnalyticsRecord[];

  page: number;

  limit: number;

  total: number;

  onPageChange: (page: number, pageSize: number) => void;

  onViewDetails: (record: ReportAnalyticsRecord) => void;
}

export default function ReportAnalyticsTable({
  loading,
  data,
  page,
  limit,
  total,
  onPageChange,
  onViewDetails,
}: ReportAnalyticsTableProps) {
  const columns: ColumnsType<ReportAnalyticsRecord> = [
    {
      title: "Date",
      dataIndex: "assignedAtFormatted",
      key: "assignedAtFormatted",
      width: 140,
    },

    {
      title: "Patient Name",
      dataIndex: "patientName",
      key: "patientName",
      ellipsis: true,
    },

    {
      title: "Donor Name",
      dataIndex: "donorName",
      key: "donorName",
      ellipsis: true,
    },

    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      key: "bloodGroup",
      width: 120,
    },

    {
      title: "Request Contact",
      dataIndex: "requestContact",
      key: "requestContact",
      width: 160,
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 170,

      render: (status: string) => (
        <Tag color={status === "REQUEST_CLOSED" ? "green" : "blue"}>
          {status === "REQUEST_CLOSED" ? "Request Closed" : "Donor Assigned"}
        </Tag>
      ),
    },

    {
      title: "Action",
      key: "action",
      width: 150,

      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Table<ReportAnalyticsRecord>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 1100 }}
      pagination={{
        current: page,
        pageSize: limit,
        total,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} records`,
        onChange: onPageChange,
      }}
    />
  );
}
