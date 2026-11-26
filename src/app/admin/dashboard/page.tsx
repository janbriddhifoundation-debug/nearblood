"use client";

import React, { useEffect, useState } from "react";

import { Spin } from "antd";

import Link from "next/link";

type NgoStats = {
  total: number;
  approved: number;
  pending: number;
};

type BloodRequestStats = {
  active: number;
  ongoing: number;
  closed: number;
};

export default function Page() {
  const [ngoStats, setNgoStats] = useState<NgoStats | null>(null);

  const [bloodRequestStats, setBloodRequestStats] =
    useState<BloodRequestStats | null>(null);

  const [ngoLoading, setNgoLoading] = useState(true);

  const [bloodRequestLoading, setBloodRequestLoading] = useState(true);

  useEffect(() => {
    const fetchNgoStats = async () => {
      try {
        const res = await fetch("/api/v1/admin/dashboard/ngo-stats");

        const data = await res.json();

        setNgoStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setNgoLoading(false);
      }
    };

    const fetchBloodRequestStats = async () => {
      try {
        const res = await fetch("/api/v1/admin/dashboard/blood-request-stats");

        if (!res.ok) {
          throw new Error("Failed to fetch blood request stats");
        }

        const data = await res.json();

        setBloodRequestStats({
          active: Number(data.active) || 0,
          ongoing: Number(data.ongoing) || 0,
          closed: Number(data.closed) || 0,
        });
      } catch (err) {
        console.error(err);

        setBloodRequestStats({
          active: 0,
          ongoing: 0,
          closed: 0,
        });
      } finally {
        setBloodRequestLoading(false);
      }
    };

    fetchNgoStats();

    fetchBloodRequestStats();
  }, []);

  return (
    <div className="min-h-screen px-8 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-gray-800">
        Dashboard page
      </h1>

      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* ngo stats card */}

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm">
          {ngoLoading ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : ngoStats ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-100 px-4 py-2">
                <p className="text-sm text-gray-500">Total NGOs</p>

                <p className="text-lg font-medium text-gray-800">
                  {ngoStats.total}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/ngo-management?status=approved">
                  <div className="cursor-pointer rounded-xl bg-gray-100 px-4 py-3 transition hover:bg-gray-200">
                    <p className="text-sm text-green-500">Approved</p>

                    <p className="text-lg font-medium text-gray-800">
                      {ngoStats.approved}
                    </p>
                  </div>
                </Link>

                <Link href="/admin/ngo-management?status=pending">
                  <div className="cursor-pointer rounded-xl bg-gray-100 px-4 py-3 transition hover:bg-gray-200">
                    <p className="text-sm text-gray-500">Pending</p>

                    <p className="text-lg font-medium text-gray-800">
                      {ngoStats.pending}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* blood request card */}

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-sm">
          {bloodRequestLoading ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : bloodRequestStats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/blood-request-monitoring">
                  <div className="cursor-pointer rounded-xl bg-gray-100 px-4 py-2 transition hover:bg-gray-200">
                    <p className="text-sm text-gray-500">
                      Total Blood Requests
                    </p>

                    <p className="text-lg font-semibold text-gray-800">
                      {bloodRequestStats.active +
                        bloodRequestStats.ongoing +
                        bloodRequestStats.closed}
                    </p>
                  </div>
                </Link>

                <Link href="/admin/blood-request-monitoring?status=ACTIVE">
                  <div className="cursor-pointer rounded-xl bg-gray-100 px-4 py-2 transition hover:bg-gray-200">
                    <p className="text-sm text-gray-500">Open</p>

                    <p className="text-lg font-semibold text-gray-800">
                      {bloodRequestStats.active}
                    </p>
                  </div>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/blood-request-monitoring?status=ONGOING">
                  <div className="cursor-pointer rounded-xl bg-gray-100 px-4 py-3 transition hover:bg-gray-200">
                    <p className="text-sm font-medium text-blue-600">Ongoing</p>

                    <p className="text-lg font-semibold text-gray-800">
                      {bloodRequestStats.ongoing}
                    </p>
                  </div>
                </Link>

                <Link href="/admin/blood-request-monitoring?status=CLOSED">
                  <div className="cursor-pointer rounded-xl bg-gray-100 px-4 py-3 transition hover:bg-gray-200">
                    <p className="text-sm font-medium text-orange-600">
                      Closed
                    </p>

                    <p className="text-lg font-semibold text-gray-800">
                      {bloodRequestStats.closed}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
