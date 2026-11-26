"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { App, Card, Col, Descriptions, Row, Select, Spin, Statistic } from "antd";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import Image from "next/image";

import { getErrorMessage } from "@/utils/getErrorMessage";
import NgoEventRegistrations from "@/components/NgoEventRegistrations";

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

  const fetchEvent = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        const { data } = await axios.get(`/api/v1/ngo/events/${params.id}`);
        setEvent(data.event);
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [params.id, message],
  );

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const handleStatusChange = async (status: EventDetails["status"]) => {
    try {
      await axios.patch(`/api/v1/ngo/events/${params.id}`, { status });
      message.success("Camp status updated");
      void fetchEvent(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const imageUrl = event?.imageFilekey
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/ngo-events/${event.imageFilekey}`
    : null;

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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold mb-2">
                  {event?.eventName}
                </h1>

                <div className="text-gray-500">Event ID: {event?.id}</div>
              </div>

              {event?.status && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status</span>
                  <Select
                    value={event.status}
                    onChange={handleStatusChange}
                    className="w-[150px]"
                    options={[
                      { label: "Upcoming", value: "ACTIVE" },
                      { label: "Ongoing", value: "ONGOING" },
                      { label: "Closed", value: "CLOSED" },
                    ]}
                  />
                </div>
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

          {event?.id && (
            <NgoEventRegistrations
              eventId={event.id}
              eventDate={event.eventDate}
              onCountsChanged={() => void fetchEvent(false)}
            />
          )}

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
