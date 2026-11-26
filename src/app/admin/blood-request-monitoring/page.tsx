"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button, Input, Select, Space, Table, Tag, Typography } from "antd";

import { SearchOutlined } from "@ant-design/icons";

import axios from "axios";

const { Title } = Typography;

type BloodRequest = {
  id: string;

  patientName: string;

  bloodGroup: string;

  urgency: string;

  hospital: string;

  units: number;

  updatedAt: string;

  status: string;
};

export default function BloodRequestMonitoringPage() {
  const [loading, setLoading] = useState(false);

  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);

  const router = useRouter();

  const searchParams = useSearchParams();

  const statusFromUrl = searchParams.get("status") || "";

  const [statusFilter, setStatusFilter] = useState(statusFromUrl);

  const [searchInput, setSearchInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setStatusFilter(statusFromUrl);
  }, [statusFromUrl]);

  const fetchBloodRequests = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/api/v1/admin/dashboard/blood-request-stats/list`,
        {
          params: {
            status: statusFilter,
            search: searchQuery,
          },
        },
      );

      setBloodRequests(response.data.requests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchBloodRequests();
  }, [fetchBloodRequests]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const columns = [
    {
      title: "Patient Name",
      dataIndex: "patientName",
      key: "patientName",
    },

    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      key: "bloodGroup",

      render: (value: string) => <Tag color="red">{value || "-"}</Tag>,
    },

    {
      title: "Urgency",
      dataIndex: "urgency",
      key: "urgency",

      render: (value: string) => {
        const urgencyValue = value?.toUpperCase();

        const color =
          urgencyValue === "HIGH"
            ? "red"
            : urgencyValue === "MEDIUM"
              ? "orange"
              : "green";

        return <Tag color={color}>{urgencyValue || "-"}</Tag>;
      },
    },

    {
      title: "Hospital",
      dataIndex: "hospital",
      key: "hospital",

      render: (value: string) => value || "-",
    },

    {
      title: "Units",
      dataIndex: "units",
      key: "units",

      render: (value: number) => value || "-",
    },

    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",

      render: (value: string) =>
        value
          ? new Date(value).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "-",
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",

      render: (value: string) => {
        const statusValue = value?.toUpperCase();

        const color =
          statusValue === "ACTIVE"
            ? "blue"
            : statusValue === "ONGOING"
              ? "orange"
              : "green";

        return <Tag color={color}>{statusValue || "-"}</Tag>;
      },
    },

    {
      title: "View more",
      key: "viewMore",

      render: (_: unknown, record: BloodRequest) => (
        <Space>
          <Button
            type="primary"
            danger
            onClick={() =>
              router.push(`/admin/blood-request-monitoring/${record.id}`)
            }
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Title level={3}>Blood Request Monitoring</Title>

        <div className="flex gap-3">
          <Input
            placeholder="Search patient name"
            className="w-72"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onPressEnter={handleSearch}
            suffix={
              <div className="ml-2 border-l border-gray-300 pl-3">
                <SearchOutlined
                  onClick={handleSearch}
                  className="cursor-pointer text-gray-400"
                />
              </div>
            }
          />

          <Select
            placeholder="Filter Status"
            className="w-44"
            allowClear
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || "")}
            options={[
              {
                label: "Active",
                value: "ACTIVE",
              },

              {
                label: "Ongoing",
                value: "ONGOING",
              },

              {
                label: "Closed",
                value: "CLOSED",
              },
            ]}
          />
        </div>
      </div>

      <Table
        bordered
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={bloodRequests}
        pagination={{
          pageSize: 10,
        }}
      />
    </div>
  );
}
