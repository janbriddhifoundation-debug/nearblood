"use client";

import axios from "axios";
import dayjs from "dayjs";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Card, Spin } from "antd";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getErrorMessage } from "@/utils/getErrorMessage";

type CertificateData = {
  certificateNumber: string;
  generatedAt: string;
  donorName: string;
  donorBloodGroup: string;
  patientName: string;
  hospital: string;
  bloodGroup: string;
  organisationName: string;
  requestId: string;
};

const Page = () => {
  const { certificateNumber } = useParams<{
    certificateNumber: string;
  }>();

  const [loading, setLoading] = useState(true);

  const [valid, setValid] = useState(false);

  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get(
          `/api/v1/public/view-certificate/${certificateNumber}`,
        );

        setValid(data?.valid ?? false);

        setCertificate(data?.certificate ?? null);
      } catch (err) {
        setValid(false);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (certificateNumber) {
      fetchCertificate();
    }
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!valid || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-xl w-full text-center">
          <CloseCircleOutlined className="text-red-500 text-6xl mb-4" />

          <div className="text-2xl font-semibold mb-2">Invalid Certificate</div>

          <div className="text-gray-500">
            {error || "Certificate could not be verified."}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <div className="text-center mb-8">
            <CheckCircleOutlined className="text-green-500 text-6xl mb-4" />

            <div className="text-3xl font-bold">Certificate Verified</div>

            <div className="text-gray-500 mt-2">
              This blood donation certificate is valid.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-500 text-sm">Certificate Number</div>
              <div className="font-semibold">
                {certificate.certificateNumber}
              </div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Generated On</div>
              <div className="font-semibold">
                {dayjs(certificate.generatedAt).format("DD MMMM YYYY")}
              </div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Donor Name</div>
              <div className="font-semibold">{certificate.donorName}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Donor Blood Group</div>
              <div className="font-semibold">{certificate.donorBloodGroup}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Patient Name</div>
              <div className="font-semibold">{certificate.patientName}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Required Blood Group</div>
              <div className="font-semibold">{certificate.bloodGroup}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Hospital</div>
              <div className="font-semibold">{certificate.hospital}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Issued By</div>
              <div className="font-semibold">
                {certificate.organisationName}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Page;
