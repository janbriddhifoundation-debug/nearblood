"use client";

import React from "react";
import { Button, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";

export interface NgoEventRecord {
  id: string;

  eventName: string;

  venueName: string | null;

  eventDate: string;

  partnerBloodBank: string | null;

  donorsRequired: number | null;

  registeredDonors: number;

  status: "ACTIVE" | "ONGOING" | "CLOSED";
}

interface NgoEventsTableProps {
  data: NgoEventRecord[];
  loading: boolean;

  page: number;
  pageSize: number;
  total: number;

  onTableChange: (page: number, pageSize: number) => void;

  onViewDetails: (record: NgoEventRecord) => void;
}

const NgoEventsTable: React.FC<NgoEventsTableProps> = ({
  data,
  loading,
  page,
  pageSize,
  total,
  onTableChange,
  onViewDetails,
}) => {
  const columns: ColumnsType<NgoEventRecord> = [
    {
      title: "Event Name",
      dataIndex: "eventName",
      key: "eventName",
      width: 160,
      ellipsis: {
        showTitle: true,
      },
    },
    {
      title: "Venue",
      dataIndex: "venueName",
      key: "venueName",
      width: 160,
      ellipsis: {
        showTitle: true,
      },
      render: (value: string | null) => value || "-",
    },
    {
      title: "Date",
      dataIndex: "eventDate",
      key: "eventDate",
      width: 140,
      render: (value: string) =>
        value ? dayjs(value).format("DD MMM YYYY") : "-",
    },
    {
      title: "Blood Bank",
      dataIndex: "partnerBloodBank",
      key: "partnerBloodBank",
      width: 130,
      ellipsis: {
        showTitle: true,
      },
      render: (value: string | null) => value || "-",
    },
    {
      title: "Required",
      dataIndex: "donorsRequired",
      key: "donorsRequired",
      width: 90,
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 70,
      render: (status: NgoEventRecord["status"]) => {
        switch (status) {
          case "ACTIVE":
            return <Tag color="processing">Active</Tag>;

          case "ONGOING":
            return <Tag color="success">Ongoing</Tag>;

          case "CLOSED":
            return <Tag color="default">Closed</Tag>;

          default:
            return <Tag>{status}</Tag>;
        }
      },
    },
    {
      title: "View Details",
      key: "viewDetails",

      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() => onViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 1050 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} records`,
      }}
      onChange={(pagination: TablePaginationConfig) => {
        onTableChange(pagination.current || 1, pagination.pageSize || 10);
      }}
    />
  );
};

export default NgoEventsTable;
