"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { App, Card, Col, Descriptions, Empty, Row, Spin, Tag } from "antd";
import Image from "next/image";

import { getErrorMessage } from "@/utils/getErrorMessage";

interface OrganisationContact {
  id: string;
  name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  govtIdFilename?: string;
}

interface OrganisationRegion {
  id: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

interface Organisation {
  id: string;

  name?: string;
  type?: string;
  regNo?: string;
  estDate?: string;
  address?: string;
  website?: string;

  regCertFilename?: string;

  approvedAt?: string;

  createdAt?: string;
  updatedAt?: string;

  OrganisationContact: OrganisationContact[];

  OrganisationRegion: OrganisationRegion[];
}

export default function Page() {
  const { message } = App.useApp();

  const [loading, setLoading] = useState(true);

  const [organisation, setOrganisation] = useState<Organisation | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get("/api/v1/ngo/profile");

        setOrganisation(data.organisation);
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [message]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: 500,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!organisation) {
    return <Empty description="Profile not found" />;
  }

  const regCertificateUrl = organisation.regCertFilename
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/ngo-reg-certificate/${organisation.regCertFilename}`
    : null;

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div className="mb-10">
        <div className="text-3xl font-semibold">NGO Profile</div>

        <div className="text-sm text-gray-500 mt-2">
          View your organisation profile and registration information.
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-semibold">
              {organisation.name || "-"}
            </div>

            <div className="text-gray-500 mt-2">
              Registration No: {organisation.regNo || "-"}
            </div>
          </div>

          <Tag color={organisation.approvedAt ? "green" : "orange"}>
            {organisation.approvedAt ? "Approved" : "Pending Approval"}
          </Tag>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Organisation Information" className="mb-6">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Organisation Name">
                {organisation.name || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Organisation Type">
                {organisation.type || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Registration Number">
                {organisation.regNo || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Established Date">
                {organisation.estDate
                  ? dayjs(organisation.estDate).format("DD MMM YYYY")
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Website">
                {organisation.website || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Address">
                {organisation.address || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Service Regions" className="mb-6">
            {organisation.OrganisationRegion.length === 0 ? (
              <Empty description="No regions added" />
            ) : (
              <Descriptions bordered column={1}>
                {organisation.OrganisationRegion.map((region, index) => (
                  <Descriptions.Item
                    key={region.id}
                    label={`Region ${index + 1}`}
                  >
                    <div>
                      <div>{region.locationName || "-"}</div>

                      {(region.latitude || region.longitude) && (
                        <div className="text-gray-500 text-sm mt-1">
                          {region.latitude}, {region.longitude}
                        </div>
                      )}
                    </div>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </Card>

          <Card title="System Information">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Created At">
                {organisation.createdAt
                  ? dayjs(organisation.createdAt).format("DD MMM YYYY, hh:mm A")
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Last Updated">
                {organisation.updatedAt
                  ? dayjs(organisation.updatedAt).format("DD MMM YYYY, hh:mm A")
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Approved At">
                {organisation.approvedAt
                  ? dayjs(organisation.approvedAt).format(
                      "DD MMM YYYY, hh:mm A",
                    )
                  : "Not Approved Yet"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Registration Certificate" className="mb-6">
            {regCertificateUrl ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 300,
                }}
              >
                <Image
                  src={regCertificateUrl}
                  alt="Registration Certificate"
                  fill
                  unoptimized
                  className="rounded border object-contain"
                />
              </div>
            ) : (
              <Empty description="No certificate uploaded" />
            )}
          </Card>

          <Card title="Organisation Contacts">
            {organisation.OrganisationContact.length === 0 ? (
              <Empty description="No contacts available" />
            ) : (
              <div className="space-y-4">
                {organisation.OrganisationContact.map((contact) => {
                  const govtIdUrl = contact.govtIdFilename
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/s3/ngo-contact-id-proof/${contact.govtIdFilename}`
                    : null;

                  return (
                    <Card key={contact.id} size="small">
                      <div className="font-medium">{contact.name || "-"}</div>

                      <div className="text-gray-500 text-sm">
                        {contact.designation || "-"}
                      </div>

                      <div className="mt-3 text-sm">
                        <div>Email: {contact.email || "-"}</div>

                        <div>Phone: {contact.phone || "-"}</div>
                      </div>

                      {govtIdUrl && (
                        <div className="mt-4">
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              height: 250,
                            }}
                          >
                            <Image
                              src={govtIdUrl}
                              alt={contact.name || "Government ID"}
                              fill
                              unoptimized
                              className="rounded border object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
