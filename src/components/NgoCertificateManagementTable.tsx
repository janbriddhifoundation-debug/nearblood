"use client";

import React from "react";
import { Button, Space, Table, Tag } from "antd";
import dayjs from "dayjs";

export type CertificateManagementRecord = {
  id: string;
  assignedAt: string | null;
  donorName: string;
  patientName: string;
  status: string;
  hasCertificate: boolean;
  certificateNumber: string | null;
  request?: unknown;
};

type Props = {
  loading?: boolean;
  requests: CertificateManagementRecord[];
  generatingCertificateId?: string | null;

  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;

  onViewDetailsClick: (record: CertificateManagementRecord) => void;

  onGenerateCertificateClick: (record: CertificateManagementRecord) => void;

  onViewCertificateClick: (record: CertificateManagementRecord) => void;
};

function NgoCertificateManagementTable({
  loading,
  requests,
  generatingCertificateId,

  page,
  limit,
  total,
  onPageChange,

  onViewDetailsClick,
  onGenerateCertificateClick,
  onViewCertificateClick,
}: Props) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={requests}
      pagination={{
        current: page,
        pageSize: limit,
        total,
        showSizeChanger: false,
        onChange: onPageChange,
      }}
      scroll={{
        x: 1000,
      }}
      columns={[
        {
          title: "Date",
          dataIndex: "assignedAt",
          key: "assignedAt",
          width: 180,
          render: (value: string | null) =>
            value ? dayjs(value).format("DD MMM YYYY") : "-",
        },

        {
          title: "Patient Name",
          dataIndex: "patientName",
          key: "patientName",
        },

        {
          title: "Donor Name",
          dataIndex: "donorName",
          key: "donorName",
        },

        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          width: 180,
          render: (status: string) => {
            if (status === "REQUEST_CLOSED") {
              return <Tag color="green">Request Closed</Tag>;
            }

            return <Tag color="blue">Donor Assigned</Tag>;
          },
        },

        {
          title: "Action",
          key: "action",
          width: 300,
          render: (_: unknown, record: CertificateManagementRecord) => (
            <Space wrap>
              <Button size="small" onClick={() => onViewDetailsClick(record)}>
                View Details
              </Button>

              {record.hasCertificate ? (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => onViewCertificateClick(record)}
                >
                  View Certificate
                </Button>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  loading={generatingCertificateId === record.id}
                  onClick={() => onGenerateCertificateClick(record)}
                >
                  Generate Certificate
                </Button>
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}

export default NgoCertificateManagementTable;
