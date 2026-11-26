"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button, DatePicker, Input, Select, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { Dayjs } from "dayjs";

import { getErrorMessage } from "@/utils/getErrorMessage";
import NgoEventsTable, { NgoEventRecord } from "@/components/NgoEventsTable";

const { RangePicker } = DatePicker;

function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState<NgoEventRecord[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);

  const limit = 10;

  const [total, setTotal] = useState(0);

  const fetchEvents = useCallback(
    async (
      pageNumber = page,
      searchValue = search,
      statusValue = status,
      startDateValue = startDate,
      endDateValue = endDate,
    ) => {
      try {
        setLoading(true);

        const { data } = await axios.get("/api/v1/ngo/events", {
          params: {
            page: pageNumber,
            pageSize: limit,
            search: searchValue || undefined,
            status: statusValue || undefined,
            startDate: startDateValue || undefined,
            endDate: endDateValue || undefined,
          },
        });

        setEvents(data?.data ?? []);

        setTotal(data?.pagination?.total ?? 0);
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [page, search, status, startDate, endDate],
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const handleSearch = () => {
    setPage(1);

    setSearch(searchInput);

    fetchEvents(1, searchInput, status, startDate, endDate);
  };

  const handleStatusChange = (value: string) => {
    const selectedStatus = value || "";

    setPage(1);

    setStatus(selectedStatus);

    fetchEvents(1, search, selectedStatus, startDate, endDate);
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
  ) => {
    const start = dates?.[0]?.format("YYYY-MM-DD") || "";

    const end = dates?.[1]?.format("YYYY-MM-DD") || "";

    setPage(1);

    setStartDate(start);
    setEndDate(end);

    fetchEvents(1, search, status, start, end);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    fetchEvents(newPage, search, status, startDate, endDate);
  };

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div className="text-2xl font-semibold mb-5">Blood Donation Events</div>

      <div className="text-sm leading-[22px] text-gray-600 mb-10">
        Create, manage and monitor blood donation events.
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search events"
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

        <RangePicker onChange={handleDateRangeChange} />

        <Button type="primary" onClick={handleSearch}>
          Search
        </Button>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/ngo/blood-donation-events/add-event")}
        >
          Add Event
        </Button>
      </div>

      <NgoEventsTable
        data={events}
        loading={loading}
        page={page}
        pageSize={limit}
        total={total}
        onTableChange={handlePageChange}
        onViewDetails={(record) => {
          router.push(`/ngo/blood-donation-events/${record.id}`);
        }}
      />
    </div>
  );
}

export default Page;
