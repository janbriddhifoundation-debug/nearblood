"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Input, Select, Empty, Tooltip } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { InfoCircleOutlined } from "@ant-design/icons";
import { IOrganisation } from "@/types/organisationTypes";

const { Search } = Input;
const { Option } = Select;

interface ApiResponse {
  data: IOrganisation[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

const Page: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlStatus = searchParams.get("status") || undefined;

  const [data, setData] = useState<IOrganisation[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(urlStatus);

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
  });

  const fetchNGOs = async (
    page = 1,
    limit = 10,
    searchValue = "",
    statusValue?: string,
  ) => {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>("/api/v1/list/allNgo", {
        params: {
          page,
          limit,
          search: searchValue || undefined,
          status: statusValue || undefined,
        },
      });

      setData(res.data.data);

      const meta = res.data.meta;
      if (meta) {
        setPagination((prev) => ({
          ...prev,
          current: meta.page,
          pageSize: meta.limit,
          total: meta.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch NGOs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatus(urlStatus);
    fetchNGOs(
      pagination.current ?? 1,
      pagination.pageSize ?? 10,
      search,
      urlStatus,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  useEffect(() => {
    fetchNGOs(
      pagination.current ?? 1,
      pagination.pageSize ?? 10,
      search,
      status,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleTableChange = (p: TablePaginationConfig) => {
    fetchNGOs(p.current ?? 1, p.pageSize ?? 10, search, status);
  };

  const columns: ColumnsType<IOrganisation> = [
    {
      title: "NGO Details",
      key: "ngo_details",
      width: 250,
      render: (_: unknown, record: IOrganisation) => (
        <div className="flex flex-col">
          <strong className="text-gray-800 leading-tight truncate block">
            {record.name}
          </strong>
          <span className="text-xs text-gray-500 mt-1 truncate block">
            {record.email}
          </span>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => (
        <Tooltip title={type}>
          <div className="w-full overflow-hidden">
            <Tag className="px-2 py-0 block text-xs max-w-full truncate whitespace-nowrap">
              {type}
            </Tag>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 220,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="block truncate cursor-pointer text-gray-700">
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Registered At",
      dataIndex: "registeredAt",
      key: "registeredAt",
      width: 140,
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      render: (_: unknown, record: IOrganisation) => {
        if (record.status === "APPROVED") {
          return (
            <div className="flex flex-col leading-tight">
              <Tag color="green" className="px-2 py-[1px] text-xs w-fit">
                APPROVED
              </Tag>
              {record.approvedAt && (
                <span className="text-[11px] text-gray-500 mt-0.5">
                  {dayjs(record.approvedAt).format("hh:mm A · DD MMM YYYY")}
                </span>
              )}
            </div>
          );
        }

        return (
          <Tag color="gold" className="px-2 py-[1px] text-xs w-fit">
            PENDING
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_: unknown, record: IOrganisation) => (
        <Tooltip title="View details">
          <Button
            type="primary"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => router.push(`/admin/ngo-management/${record.key}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1320, margin: "0 auto" }}>
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold">NGO Registrations</h2>

        <div className="flex gap-3">
          <Search
            placeholder="Search NGO name"
            allowClear
            onSearch={(value) => {
              setPagination((p) => ({ ...p, current: 1 }));
              setSearch(value);
            }}
            style={{ width: 220 }}
          />

          <Select
            placeholder="Status"
            allowClear
            value={status || undefined}
            style={{ width: 160 }}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());

              if (value) {
                params.set("status", value);
              } else {
                params.delete("status");
              }

              setPagination((p) => ({ ...p, current: 1 }));
              router.push(`/admin/ngo-management?${params.toString()}`);
            }}
          >
            <Option value="approved">Approved</Option>
            <Option value="pending">Pending</Option>
          </Select>
        </div>
      </div>

      <Table
        rowKey="key"
        bordered
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <Empty
              description={
                search
                  ? "No NGO found with this name"
                  : "No NGO records available"
              }
            />
          ),
        }}
      />
    </div>
  );
};

export default Page;
