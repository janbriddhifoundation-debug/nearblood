"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Card, DatePicker, message, Spin } from "antd";
import type { Dayjs } from "dayjs";

import { getErrorMessage } from "@/utils/getErrorMessage";

const { RangePicker } = DatePicker;

type ImpactStats = {
  donorsAssigned: number;
  requestsClosed: number;
  certificatesGenerated: number;
  totalDonors: number;
};

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card
      bordered
      className="h-full"
      styles={{
        body: {
          padding: 24,
        },
      }}
    >
      <div className="text-sm text-gray-500 mb-2">{title}</div>

      <div className="text-4xl font-semibold">{value}</div>
    </Card>
  );
}

function Page() {
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [stats, setStats] = useState<ImpactStats>({
    donorsAssigned: 0,
    requestsClosed: 0,
    certificatesGenerated: 0,
    totalDonors: 0,
  });

  const fetchImpactStats = useCallback(
    async (selectedDateRange = dateRange) => {
      try {
        setLoading(true);

        const { data } = await axios.get("/api/v1/ngo/impact-dashboard", {
          params: {
            from: selectedDateRange?.[0]?.format("YYYY-MM-DD") || undefined,

            to: selectedDateRange?.[1]?.format("YYYY-MM-DD") || undefined,
          },
        });

        setStats(
          data?.stats ?? {
            donorsAssigned: 0,
            requestsClosed: 0,
            certificatesGenerated: 0,
            totalDonors: 0,
          },
        );
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [dateRange],
  );

  useEffect(() => {
    void fetchImpactStats();
  }, [fetchImpactStats]);

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div className="text-2xl font-semibold mb-5">Impact Dashboard</div>

      <div className="text-sm leading-[22px] text-gray-600 mb-10">
        Track donor engagement, completed requests, certificates generated and
        overall donor impact.
      </div>

      <div className="mb-8">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            const value = dates as [Dayjs | null, Dayjs | null] | null;

            setDateRange(value);

            void fetchImpactStats(value);
          }}
          format="DD MMM YYYY"
        />
      </div>

      <Spin spinning={loading}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Donors Assigned" value={stats.donorsAssigned} />

          <StatCard title="Requests Closed" value={stats.requestsClosed} />

          <StatCard
            title="Certificates Generated"
            value={stats.certificatesGenerated}
          />

          <StatCard title="Total Donors" value={stats.totalDonors} />
        </div>
      </Spin>
    </div>
  );
}

export default Page;
