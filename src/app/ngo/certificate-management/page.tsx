"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { message, Input, Select, Button } from "antd";
import { useRouter } from "next/navigation";

import { getErrorMessage } from "@/utils/getErrorMessage";
import NgoCertificateManagementTable, {
  CertificateManagementRecord,
} from "@/components/NgoCertificateManagementTable";
import RequestDetailsModal from "@/components/RequestDetailsModal";

function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [requests, setRequests] = useState<CertificateManagementRecord[]>([]);

  const [generatingCertificateId, setGeneratingCertificateId] = useState<
    string | null
  >(null);

  const [isRequestDetailsModalOpen, setRequestDetailsModalOpen] =
    useState(false);

  const [requestDetailsModalData, setRequestDetailsModalData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const limit = 10;

  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(
    async (pageNumber = page, searchValue = search, statusValue = status) => {
      try {
        setLoading(true);

        const { data } = await axios.get("/api/v1/ngo/certificate-management", {
          params: {
            page: pageNumber,
            limit,
            search: searchValue || undefined,
            status: statusValue || undefined,
          },
        });

        setRequests(data?.requests ?? []);

        setTotal(data?.pagination?.total ?? 0);
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [page, search, status],
  );

  const handleGenerateCertificate = async (
    request: CertificateManagementRecord,
  ) => {
    try {
      setGeneratingCertificateId(request.id);

      await axios.post("/api/v1/ngo/certificate-management/generate", {
        requestDonorId: request.id,
      });

      message.success("Certificate generated successfully.");

      router.push(`/ngo/certificate/${request.id}`);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setGeneratingCertificateId(null);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleSearch = () => {
    setPage(1);

    setSearch(searchInput);

    fetchRequests(1, searchInput, status);
  };

  const handleStatusChange = (value: string) => {
    const selectedStatus = value || "";

    setPage(1);

    setStatus(selectedStatus);

    fetchRequests(1, search, selectedStatus);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    fetchRequests(newPage, search, status);
  };

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div className="text-2xl font-semibold mb-5">Certificate Management</div>

      <div className="text-sm leading-[22px] text-gray-600 mb-10">
        Generate, manage and verify blood donation certificates.
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

        <Button type="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <NgoCertificateManagementTable
        loading={loading}
        requests={requests}
        generatingCertificateId={generatingCertificateId}
        page={page}
        limit={limit}
        total={total}
        onPageChange={handlePageChange}
        onViewDetailsClick={(request) => {
          setRequestDetailsModalData(
            (request.request as Record<string, unknown>) ?? null,
          );

          setRequestDetailsModalOpen(true);
        }}
        onGenerateCertificateClick={handleGenerateCertificate}
        onViewCertificateClick={(request) => {
          router.push(`/ngo/certificate/${request.id}`);
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
