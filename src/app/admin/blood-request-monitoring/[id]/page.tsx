"use client";

import { useCallback, useEffect, useState } from "react";

import axios from "axios";

import { Card, Descriptions, Spin, Steps, Tag, Typography } from "antd";

import { useParams } from "next/navigation";

const { Title, Text } = Typography;

type RequestActivity = {
  activity: string;

  createdAt: string;
};

type BloodRequest = {
  id: string;

  patientName: string;

  age: number;

  gender: string;

  bloodGroup: string;

  units: number;

  reason: string;

  hospital: string;

  locationName: string;

  requirementDate: string;

  urgency: string;

  contact: string;

  relWRequester: string;

  patientAddress: string;

  notes: string;

  RequestActivity: RequestActivity[];
};

export default function BloodRequestDetailsPage() {
  const params = useParams();

  const requestId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [loading, setLoading] = useState(false);

  const [requestData, setRequestData] = useState<BloodRequest | null>(null);

  const fetchRequestDetails = useCallback(async () => {
    try {
      if (!requestId) {
        return;
      }

      setLoading(true);

      const response = await axios.get(
        `/api/v1/admin/blood-request-monitoring/${requestId}`,
      );

      setRequestData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  if (loading || !requestData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const urgencyValue = requestData.urgency?.toUpperCase() || "LOW";

  const urgencyColor =
    urgencyValue === "HIGH"
      ? "red"
      : urgencyValue === "MEDIUM"
        ? "orange"
        : "green";

  const latestActivity = requestData.RequestActivity?.[0]?.activity;

  const getCurrentStep = (status: string | undefined) => {
    switch (status) {
      case "REQUEST_SENT":
        return 0;

      case "DONORS_ASSIGNED":
        return 1;

      case "DONATION_PROOF_SUBMITTED":
        return 2;

      case "REQUEST_CLOSED":
        return 3;

      default:
        return 0;
    }
  };

  const getActivityDate = (activityName: string) => {
    const activity = requestData.RequestActivity?.find(
      (item: RequestActivity) => item.activity === activityName,
    );

    if (!activity) {
      return "Pending";
    }

    return (
      <>
        {new Date(activity.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}

        <br />

        {new Date(activity.createdAt).toLocaleTimeString()}
      </>
    );
  };

  const stepsItems = [
    {
      title: "Request Sent",

      description: (
        <div>
          <p>#{requestData.id}</p>

          <p className="mt-1 text-xs text-gray-500">
            {getActivityDate("REQUEST_SENT")}
          </p>
        </div>
      ),
    },

    {
      title: "Getting Matched",

      description: (
        <div>
          <p>Finding a donor</p>

          <p className="mt-1 text-xs text-gray-500">
            {getActivityDate("DONORS_ASSIGNED")}
          </p>
        </div>
      ),
    },

    {
      title: "Donor Found",

      description: (
        <div>
          <p>Donor assigned</p>

          <p className="mt-1 text-xs text-gray-500">
            {getActivityDate("DONORS_ASSIGNED")}
          </p>
        </div>
      ),
    },

    {
      title: "Request Closed",

      description: (
        <div>
          <p>Request completed</p>

          <p className="mt-1 text-xs text-gray-500">
            {getActivityDate("REQUEST_CLOSED")}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <Title level={2} className="!mb-1">
            Request #{requestData.id}
          </Title>

          <Text className="!text-base !text-gray-500">
            Blood request monitoring details
          </Text>
        </div>

        <Tag
          color={urgencyColor}
          className="!rounded-full !border !px-6 !py-2 !text-sm !font-bold uppercase"
        >
          {urgencyValue} URGENCY
        </Tag>
      </div>

      <Card>
        <div className="mb-8">
          <Title level={4} className="!mb-1">
            Request Timeline
          </Title>

          <Text className="text-gray-500">
            Track the current request progress
          </Text>
        </div>

        <div className="hidden lg:block">
          <Steps current={getCurrentStep(latestActivity)} items={stepsItems} />
        </div>

        <div className="mt-4 lg:hidden">
          <Steps
            direction="vertical"
            current={getCurrentStep(latestActivity)}
            items={stepsItems}
          />
        </div>
      </Card>

      <Card title="Patient Details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Patient Name">
            {requestData.patientName || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Age">
            {requestData.age || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Gender">
            {requestData.gender || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Blood Group">
            <Tag color="red">{requestData.bloodGroup || "-"}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Units">
            {requestData.units || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Reason">
            {requestData.reason || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Hospital Details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Hospital">
            {requestData.hospital || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Location">
            {requestData.locationName || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Requirement Date">
            {requestData.requirementDate
              ? new Date(requestData.requirementDate).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  },
                )
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Urgency">
            <Tag
              color={urgencyColor}
              className="!rounded-full !px-4 !py-1 !font-semibold uppercase"
            >
              {urgencyValue}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Contact Details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Contact">
            {requestData.contact || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Relation">
            {requestData.relWRequester || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Patient Address">
            {requestData.patientAddress || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Notes">
            {requestData.notes || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
