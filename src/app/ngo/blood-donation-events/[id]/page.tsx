"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { App, Card, Col, Descriptions, Row, Spin, Statistic, Tag } from "antd";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import Image from "next/image";

import { getErrorMessage } from "@/utils/getErrorMessage";

interface EventDetails {
  id?: string;

  eventName?: string;
  purpose?: string;

  eventDate?: string;

  venueName?: string;

  latitude?: number;
  longitude?: number;

  partnerBloodBank?: string;

  donorsRequired?: number;

  registeredDonors?: number;

  actualDonors?: number;

  unitsCollected?: number;

  imageFilekey?: string;

  notes?: string;

  status?: "ACTIVE" | "ONGOING" | "CLOSED";
}

function Page() {
  const params = useParams();

  const { message } = App.useApp();

  const [loading, setLoading] = useState(true);

  const [event, setEvent] = useState<EventDetails>();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get(`/api/v1/ngo/events/${params.id}`);

        setEvent(data.event);
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void fetchEvent();
  }, [params.id, message]);

  const imageUrl = event?.imageFilekey
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/ngo-events/${event.imageFilekey}`
    : null;

  const getStatusColor = () => {
    switch (event?.status) {
      case "ACTIVE":
        return "blue";
      case "ONGOING":
        return "green";
      case "CLOSED":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div className="text-2xl font-semibold mb-5">Event Details</div>

      <div className="text-sm leading-[22px] text-gray-600 mb-10">
        View complete details of a blood donation event.
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold mb-2">
                  {event?.eventName}
                </h1>

                <div className="text-gray-500">Event ID: {event?.id}</div>
              </div>

              {event?.status && (
                <Tag
                  color={getStatusColor()}
                  style={{
                    padding: "6px 16px",
                    fontSize: 14,
                  }}
                >
                  {event.status}
                </Tag>
              )}
            </div>
          </Card>

          {imageUrl && (
            <Card className="mb-6">
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 300,
                }}
              >
                <Image
                  src={imageUrl}
                  alt={event?.eventName || "Event Image"}
                  fill
                  className="rounded-lg border object-cover"
                  unoptimized
                />
              </div>
            </Card>
          )}

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Donors Required"
                  value={event?.donorsRequired ?? 0}
                />
              </Card>
            </Col>

            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Registered Donors"
                  value={event?.registeredDonors ?? 0}
                />
              </Card>
            </Col>

            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Actual Donors"
                  value={event?.actualDonors ?? 0}
                />
              </Card>
            </Col>

            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Units Collected"
                  value={event?.unitsCollected ?? 0}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Event Information" className="mb-6">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Event Name">
                {event?.eventName || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Purpose">
                {event?.purpose || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Event Date">
                {event?.eventDate
                  ? dayjs(event.eventDate).format("DD MMM YYYY")
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                {event?.status || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Partner Blood Bank">
                {event?.partnerBloodBank || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Notes">
                {event?.notes || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Location Information" className="mb-6">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Venue">
                {event?.venueName || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Latitude">
                {event?.latitude ?? "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Longitude">
                {event?.longitude ?? "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
    </div>
  );
}

export default Page;
