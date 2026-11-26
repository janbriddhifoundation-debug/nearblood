"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { message, Input, Select, Button, DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";

import { getErrorMessage } from "@/utils/getErrorMessage";

import ReportAnalyticsTable, {
  ReportAnalyticsRecord,
} from "@/components/NgoReportsAnalyticsTable";

import RequestDetailsModal from "@/components/RequestDetailsModal";

const { RangePicker } = DatePicker;

function Page() {
  const [loading, setLoading] = useState(false);

  const [reports, setReports] = useState<ReportAnalyticsRecord[]>([]);

  const [isRequestDetailsModalOpen, setRequestDetailsModalOpen] =
    useState(false);

  const [requestDetailsModalData, setRequestDetailsModalData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [page, setPage] = useState(1);

  const limit = 10;

  const [total, setTotal] = useState(0);

  const fetchReports = useCallback(
    async (
      pageNumber = page,
      searchValue = search,
      statusValue = status,
      selectedDateRange = dateRange,
    ) => {
      try {
        setLoading(true);

        const { data } = await axios.get("/api/v1/ngo/reports-analytics", {
          params: {
            page: pageNumber,
            limit,

            search: searchValue || undefined,

            status: statusValue || undefined,

            from: selectedDateRange?.[0]?.format("YYYY-MM-DD") || undefined,

            to: selectedDateRange?.[1]?.format("YYYY-MM-DD") || undefined,
          },
        });

        setReports(data?.reports ?? []);

        setTotal(data?.pagination?.total ?? 0);
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [page, search, status, dateRange],
  );

  const handleSearch = () => {
    setPage(1);

    setSearch(searchInput);

    fetchReports(1, searchInput, status, dateRange);
  };

  const handleStatusChange = (value: string) => {
    const selectedStatus = value || "";

    setPage(1);

    setStatus(selectedStatus);

    fetchReports(1, search, selectedStatus, dateRange);
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
  ) => {
    setPage(1);

    setDateRange(dates);

    fetchReports(1, search, status, dates);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    fetchReports(newPage, search, status, dateRange);
  };

  const handleExportCsv = async () => {
    try {
      const response = await axios.get("/api/v1/ngo/reports-analytics", {
        params: {
          export: true,

          search: search || undefined,

          status: status || undefined,

          from: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,

          to: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
        },

        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        `donor-assignment-report-${dayjs().format("YYYY-MM-DD")}.csv`,
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      message.success("Report downloaded successfully.");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };
  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);
  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div className="text-2xl font-semibold mb-5">Reports & Analytics</div>

      <div className="text-sm leading-[22px] text-gray-600 mb-10">
        View donor assignment reports and export filtered data.
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search patient name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 300 }}
        />

        <Select
          placeholder="Filter by status"
          allowClear
          value={status || undefined}
          onChange={(value) => handleStatusChange(value ?? "")}
          style={{ width: 220 }}
          options={[
            {
              label: "Donor Assigned",
              value: "DONOR_ASSIGNED",
            },
            {
              label: "Request Closed",
              value: "REQUEST_CLOSED",
            },
          ]}
        />

        <RangePicker
          value={dateRange}
          onChange={(dates) =>
            handleDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)
          }
          format="DD MMM YYYY"
        />

        <Button type="primary" onClick={handleSearch}>
          Search
        </Button>

        <Button onClick={handleExportCsv}>Export CSV</Button>
      </div>

      <ReportAnalyticsTable
        loading={loading}
        data={reports}
        page={page}
        limit={limit}
        total={total}
        onPageChange={handlePageChange}
        onViewDetails={(record) => {
          setRequestDetailsModalData(
            (record.request as Record<string, unknown>) ?? null,
          );

          setRequestDetailsModalOpen(true);
        }}
      />

      <RequestDetailsModal
        data={requestDetailsModalData}
        isModalOpen={isRequestDetailsModalOpen}
        handleCancel={() => {
          setRequestDetailsModalOpen(false);
          setRequestDetailsModalData(null);
        }}
      />
    </div>
  );
}

export default Page;
