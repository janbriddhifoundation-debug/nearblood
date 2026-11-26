import { Button, Table } from "antd";
import React from "react";
import dayjs from "dayjs";

export type DonationVerificationRecord = {
  id: string;
  assignedAt?: string;
  donorName?: string;
  patientName?: string;
  status?: string;
  hasProof?: boolean;
  proofId?: string | null;
  proofFileKey?: string | null;
  request?: Record<string, unknown>;
};

type NgoDonationVerificationTableProps = {
  loading: boolean;
  requests: DonationVerificationRecord[];
  uploadingRequestId: string | null;

  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;

  onViewDetailsClick: (request: DonationVerificationRecord) => void;
  onUploadProofClick: (request: DonationVerificationRecord) => void;
  onViewProofClick: (request: DonationVerificationRecord) => void;
};

const NgoDonationVerificationTable: React.FC<
  NgoDonationVerificationTableProps
> = ({
  loading,
  requests,
  uploadingRequestId,

  page,
  limit,
  total,
  onPageChange,

  onViewDetailsClick,
  onUploadProofClick,
  onViewProofClick,
}) => {
  const dataSource = requests.map((item, index) => ({
    ...item,
    key: item.id ?? index,
  }));

  const columns = [
    {
      title: "Date",
      dataIndex: "assignedAt",
      render: (assignedAt: string) => (
        <span className="whitespace-nowrap">
          {assignedAt ? dayjs(assignedAt).format("D MMMM, YYYY") : "-"}
        </span>
      ),
    },
    {
      title: "Patient Name",
      dataIndex: "patientName",
      render: (patientName: string) => (
        <span className="whitespace-nowrap">{patientName || "-"}</span>
      ),
    },
    {
      title: "Donor Name",
      dataIndex: "donorName",
      render: (donorName: string) => (
        <span className="whitespace-nowrap">{donorName || "-"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        const isClosed = [
          "REQUEST_CLOSED",
          "DONATION_PROOF_SUBMITTED",
        ].includes(status);

        return (
          <span
            className="whitespace-nowrap"
            style={{
              color: isClosed ? "green" : "blue",
            }}
          >
            {isClosed ? "Request Closed" : "Donors Assigned"}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (_: unknown, record: DonationVerificationRecord) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => onViewDetailsClick(record)}>
            View Details
          </Button>

          {record.hasProof ? (
            <Button
              size="small"
              type="primary"
              onClick={() => onViewProofClick(record)}
            >
              View Proof
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              loading={uploadingRequestId === record.id}
              onClick={() => onUploadProofClick(record)}
            >
              Upload Proof
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border rounded-md border-gray-100 max-w-full overflow-x-auto">
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: false,
          onChange: onPageChange,
        }}
      />
    </div>
  );
};

export default NgoDonationVerificationTable;
