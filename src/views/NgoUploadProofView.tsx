"use client";

import { InboxOutlined } from "@ant-design/icons";
import { Button, Input, message, Typography, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UploadFile, UploadProps } from "antd";
import axios from "axios";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

type UploadResponse = {
  success: boolean;
  filekey: string;
  url: string;
};

type CustomUploadFile = UploadFile<UploadResponse>;

const NgoUploadProofView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestIdFromUrl = searchParams.get("requestId");

  const maxLength = 600;

  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    requestId: undefined as string | undefined,
    feedback: "",
    fileNames: [] as string[],
  });

  useEffect(() => {
    if (!requestIdFromUrl) {
      message.error("Invalid request.");
      router.push("/ngo/donation-verification");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      requestId: requestIdFromUrl,
    }));
  }, [requestIdFromUrl, router]);

  const draggerProps: UploadProps = {
    name: "file",
    multiple: true,
    maxCount: 5,
    showUploadList: true,
    accept: ".jpg,.jpeg,.png,.webp",
    action: "/api/v1/upload-file",
    fileList,

    data: {
      type: "TEMP_BLOOD_DONATION_PROOF",
    },

    onChange(info) {
      const { status, response } = info.file;

      setFileList(info.fileList);

      if (status === "done") {
        message.success(`${info.file.name} uploaded successfully.`);

        if (response?.filekey) {
          setFormData((prev) => ({
            ...prev,
            fileNames: [...prev.fileNames, response.filekey],
          }));
        }
      }

      if (status === "error") {
        message.error(`${info.file.name} upload failed.`);
      }
    },

    onRemove(file) {
      const filekey = file.response?.filekey;

      if (filekey) {
        setFormData((prev) => ({
          ...prev,
          fileNames: prev.fileNames.filter((key) => key !== filekey),
        }));
      }

      axios
        .delete("/api/v1/delete-upload", {
          data: {
            filekey,
            type: "TEMP_BLOOD_DONATION_PROOF",
          },
        })
        .then(() => {
          message.success(`${file.name} removed successfully.`);

          setFileList((prevList) => prevList.filter((f) => f.uid !== file.uid));
        })
        .catch(() => {
          message.error(`${file.name} removal failed.`);
        });
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.requestId) {
      message.error("Request ID not found.");
      return;
    }

    if (formData.fileNames.length === 0) {
      message.error("Please upload at least one proof image.");
      return;
    }

    try {
      setIsSubmitting(true);

      await axios.post("/api/v1/ngo/upload-proof", {
        ...formData,
      });

      message.success("Donation proof submitted successfully.");

      setFileList([]);

      setFormData({
        requestId: undefined,
        feedback: "",
        fileNames: [],
      });

      router.push("/ngo/donation-verification");
    } catch (error) {
      console.error(error);

      message.error("Failed to submit proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        maxWidth: "1380px",
        margin: "0 auto",
      }}
    >
      <div className="mb-12">
        <h1 className="text-[#383435] text-xl font-semibold">
          Blood Donation Proof
        </h1>

        <h3 className="text-black/45">
          Upload donation proof for the assigned request
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <Text strong>Request ID</Text>

          <Input
            value={requestIdFromUrl ?? ""}
            readOnly
            size="large"
            style={{
              width: 400,
              marginTop: 8,
            }}
          />
        </div>

        <Dragger {...draggerProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>

          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>

          <p className="ant-upload-hint">
            Support for single or multiple image uploads.
          </p>
        </Dragger>

        <div
          style={{
            marginTop: 48,
          }}
        >
          <Title level={3} style={{ marginBottom: 0 }}>
            Additional Feedback
          </Title>

          <Text
            strong
            style={{
              color: "#555",
              display: "block",
              marginBottom: 16,
            }}
          >
            Add notes if required.
          </Text>

          <TextArea
            rows={5}
            maxLength={600}
            value={formData.feedback}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                feedback: e.target.value,
              }));
            }}
          />

          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              {maxLength - formData.feedback.length} characters remaining
            </Text>
          </div>

          <Button
            type="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            htmlType="submit"
            danger
            size="large"
          >
            Submit Proof
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NgoUploadProofView;
