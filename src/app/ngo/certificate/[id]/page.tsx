"use client";

import { Button, Spin } from "antd";
import Image from "next/image";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { useParams } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { message } from "antd";

type CertificateData = {
  id: string;
  certificateNumber: string;
  generatedAt: string;
  donorName: string;
  donorBloodGroup: string;
  patientName: string;
  hospital: string;
  bloodGroup: string;
  requirementDate: string | null;
  organisationName: string;
  requestId: string;
};

const Page = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  const { id } = useParams<{
    id: string;
  }>();

  const [loading, setLoading] = useState(true);

  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  const fetchCertificate = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `/api/v1/ngo/certificate-management/${id}`,
      );

      setCertificate(data?.certificate ?? null);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    if (id) {
      fetchCertificate();
    }
  }, [id, fetchCertificate]);

  const certificateData = useMemo(
    () => ({
      name: certificate?.donorName ?? "",
      date: certificate?.generatedAt
        ? dayjs(certificate.generatedAt).format("MMMM D, YYYY")
        : "",
      certificateNumber: certificate?.certificateNumber ?? "",
    }),
    [certificate],
  );

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/view-certificate/${encodeURIComponent(
          certificateData.certificateNumber,
        )}`
      : "";

  async function handleDownload() {
    if (!ref.current) return;

    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: false,
    };

    const canvas = await html2canvas(ref.current, options);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `${certificateData.name}-${certificateData.certificateNumber}.png`;

      a.click();

      URL.revokeObjectURL(url);
    }, "image/png");
  }

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        Certificate not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        ref={ref}
        className="relative w-full shadow-lg overflow-hidden border"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e5e7eb",
        }}
      >
        <div
          className="absolute z-[1] top-0 left-0 w-8 h-8 sm:w-16 sm:h-16 lg:w-32 lg:h-32 rounded-br-[75px] sm:rounded-br-[112px] lg:rounded-br-[150px]"
          style={{ backgroundColor: "#ef4444" }}
        />

        <div
          className="absolute z-[1] bottom-0 right-0 w-8 h-8 sm:w-16 sm:h-16 lg:w-32 lg:h-32 rounded-tl-[75px] sm:rounded-tl-[112px] lg:rounded-tl-[150px]"
          style={{ backgroundColor: "#ef4444" }}
        />

        <div className="scale-75 lg:scale-100 relative z-10 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 text-center">
          <div className="flex justify-center items-center space-x-2 mb-2 sm:mb-3 lg:mb-4">
            <Image
              src="/sitelogo.png"
              alt="Near Blood Logo"
              className="max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]"
              width={400}
              height={200}
            />
          </div>

          <div className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-1">
            CERTIFICATE
          </div>

          <div
            className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-10 lg:mb-14"
            style={{ color: "#dc2626" }}
          >
            OF BLOOD DONATION
          </div>

          <div className="text-sm sm:text-base lg:text-lg font-bold">
            This certificate is awarded to
          </div>

          <div
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3"
            style={{ color: "#111827" }}
          >
            {certificateData.name}
          </div>

          <div className="text-base sm:text-lg lg:text-xl font-semibold max-w-2xl mx-auto mb-4 sm:mb-5 lg:mb-6 px-2">
            to honor their selfless act of donating blood, which has helped save
            lives and bring hope to those in need.
          </div>

          <div
            className="font-bold text-base sm:text-lg lg:text-[22px] leading-6 sm:leading-7 lg:leading-[30px]"
            style={{ color: "#374151" }}
          >
            Given on this day, {certificateData.date}.
          </div>

          <div
            className="mb-6 sm:mb-8 lg:mb-10 font-bold text-base sm:text-lg lg:text-[22px] leading-6 sm:leading-7 lg:leading-[30px]"
            style={{ color: "#374151" }}
          >
            Certificate Number: {certificateData.certificateNumber}
          </div>

          <div className="mt-6 sm:mt-8 lg:mt-10 relative flex justify-center items-center gap-8">
            <div>
              <QRCodeCanvas
                value={verifyUrl}
                size={100}
                bgColor="#fff"
                fgColor="#000000"
                level="H"
                marginSize={0}
              />
            </div>

            <div>
              <div className="font-bold text-sm sm:text-base lg:text-lg">
                Anupam Kakati
              </div>

              <div
                className="font-bold text-sm sm:text-base lg:text-lg"
                style={{ color: "#374151" }}
              >
                Director
              </div>

              <div className="font-bold mt-1 text-sm sm:text-base lg:text-lg">
                NEAR BLOOD
              </div>
            </div>
          </div>
        </div>

        <div
          className="scale-75 lg:scale-100 text-xs sm:text-xs lg:text-sm text-center pb-2 sm:pb-3 lg:pb-4 px-2 z-[2]"
          style={{ color: "#6b7280" }}
        >
          This is a computer-generated document, no signature is required
        </div>
      </div>

      <div className="flex justify-center mt-10">
        <Button onClick={handleDownload}>Download Certificate</Button>
      </div>
    </div>
  );
};

export default Page;
