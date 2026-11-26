"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Button, Spin } from "antd";

import { LeftOutlined } from "@ant-design/icons";

import { useParams } from "next/navigation";

import ApproveNgoButton from "@/components/ApproveNgoButton";

type NGO = {
  id: string;
  name: string | null;
  type: string | null;
  regNo: string | null;
  estDate: string | null;
  address: string | null;
  website: string | null;
  regCert: string | null;
  createdAt: string | null;
  approvedAt: string | null;

  user?: {
    name?: string | null;
    email?: string | null;
  };

  contact?: {
    name?: string | null;
    designation?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;

  regions?: {
    locationName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }[];
};

export default function NgoDetailsPage() {
  const params = useParams();

  const id = params?.id as string;

  const [ngo, setNgo] = useState<NGO | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchNgo = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/ngo/${id}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setNgo(null);

        return;
      }

      const data: { data: NGO } = await res.json();

      setNgo(data.data);
    } catch (error) {
      console.error(error);

      setNgo(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetchNgo();
  }, [id, fetchNgo]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!ngo) {
    return <p className="p-5">No NGO found</p>;
  }

  return (
    <div className="space-y-5 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">NGO Details</h1>

          <p className="mt-1 text-sm text-gray-500">
            View ngo information and verification details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ApproveNgoButton ngoId={ngo.id} approvedAt={ngo.approvedAt} />

          <span
            className={`rounded-full border px-5 py-2 text-sm font-semibold ${
              ngo.approvedAt
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-yellow-200 bg-yellow-50 text-yellow-700"
            }`}
          >
            {ngo.approvedAt ? "APPROVED" : "PENDING"}
          </span>

          <Link href="/admin/ngo-management">
            <Button icon={<LeftOutlined />} className="!h-[42px] !rounded-xl">
              Back to Ngo management
            </Button>
          </Link>
        </div>
      </div>

      {/* TOP GRID */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* BASIC INFO */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Basic Info</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
            <Info label="Name" value={ngo.name} />

            <Info label="Type" value={ngo.type} />

            <Info label="Reg No" value={ngo.regNo} />

            <Info
              label="Established"
              value={
                ngo.estDate
                  ? new Date(ngo.estDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"
              }
            />

            <Info
              label="Applied"
              value={
                ngo.createdAt
                  ? new Date(ngo.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"
              }
            />

            {ngo.approvedAt && (
              <Info
                label="Approved"
                value={new Date(ngo.approvedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </div>
        </section>

        {/* CONTACT */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Contact</h2>
          </div>

          <div className="p-6">
            {ngo.contact ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Name" value={ngo.contact.name} />

                <Info label="Email" value={ngo.contact.email} />

                <Info label="Phone" value={ngo.contact.phone} />

                <Info label="Role" value={ngo.contact.designation} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No contact found</p>
            )}
          </div>
        </section>
      </div>

      {/* SECOND GRID */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* USER INFO */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">User Info</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
            <Info label="Name" value={ngo.user?.name} />

            <Info label="Email" value={ngo.user?.email} />
          </div>
        </section>

        {/* ADDRESS + CERTIFICATE */}

        <div className="space-y-5">
          {/* ADDRESS */}

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">Address</h2>
            </div>

            <div className="space-y-3 p-6">
              <p className="text-sm text-gray-700">{ngo.address || "N/A"}</p>

              {ngo.website && (
                <a
                  href={ngo.website}
                  target="_blank"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {ngo.website}
                </a>
              )}
            </div>
          </section>

          {/* CERTIFICATE */}

          {ngo.regCert && (
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Certificate
                </h2>
              </div>

              <div className="p-6">
                <a
                  href={ngo.regCert}
                  target="_blank"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View Certificate
                </a>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* REGIONS */}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Regions</h2>
        </div>

        <div className="p-6">
          {!ngo.regions || ngo.regions.length === 0 ? (
            <p className="text-sm text-gray-500">No regions found</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ngo.regions.map((region, index) => (
                <div key={index} className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">
                    {region.locationName}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {region.latitude}, {region.longitude}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* REUSABLE INFO CARD */

function Info({
  label,
  value,
}: {
  label: string;

  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="mb-1 text-xs text-gray-500">{label}</p>

      <p className="text-sm font-semibold text-gray-800">{value || "N/A"}</p>
    </div>
  );
}
