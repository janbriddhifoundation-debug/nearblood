"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

import LocationAutoComplete from "@/components/LocationAutoComplete";

const { TextArea } = Input;
const { Title } = Typography;

export interface NgoEventFormValues {
  eventName: string;
  purpose?: string;

  eventDate: string;

  venueName?: string;

  latitude?: number;
  longitude?: number;

  partnerBloodBank?: string;

  donorsRequired?: number;

  imageFilekey?: string;

  notes?: string;

  status?: "ACTIVE" | "ONGOING" | "CLOSED";
}

interface NgoEventFormProps {
  mode: "create" | "view";

  initialValues?: Partial<NgoEventFormValues>;

  onSubmit?: (values: NgoEventFormValues) => Promise<void>;
}

interface LocationData {
  location: string;
  lat: string;
  lon: string;
}

export default function NgoEventForm({
  mode,
  initialValues,
  onSubmit,
}: NgoEventFormProps) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const readOnly = mode === "view";

  useEffect(() => {
    if (!initialValues) return;

    form.setFieldsValue({
      ...initialValues,

      eventDate: initialValues.eventDate
        ? dayjs(initialValues.eventDate)
        : undefined,
    });
  }, [initialValues, form]);

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append("type", "TEMP_NGO_EVENT_IMAGE");

      const { data } = await axios.post("/api/v1/upload-file", formData);

      form.setFieldValue("imageFilekey", data.filekey);

      message.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);

      message.error("Image upload failed");
    }

    return false;
  };

  const submitForm = async (values: Record<string, unknown>) => {
    if (!onSubmit) return;

    try {
      setLoading(true);

      await onSubmit({
        ...values,

        eventDate: (values.eventDate as dayjs.Dayjs).format("YYYY-MM-DD"),
      } as NgoEventFormValues);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title level={3}>
        {mode === "create" ? "Create Event" : "Event Details"}
      </Title>

      <Form layout="vertical" form={form} onFinish={submitForm}>
        <Form.Item
          label="Event Name"
          name="eventName"
          rules={[
            {
              required: true,
              message: "Please enter event name",
            },
          ]}
        >
          <Input disabled={readOnly} placeholder="Enter event name" />
        </Form.Item>

        <Form.Item label="Purpose" name="purpose">
          <TextArea rows={4} disabled={readOnly} />
        </Form.Item>

        <Form.Item
          label="Event Date"
          name="eventDate"
          rules={[
            {
              required: true,
              message: "Please select date",
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} disabled={readOnly} />
        </Form.Item>

        <Form.Item
          label="Venue"
          name="venueName"
          rules={[
            {
              required: true,
              message: "Please select venue",
            },
          ]}
        >
          <LocationAutoComplete
            onSelectLocation={(
              locationData: LocationData | LocationData[] | null,
            ) => {
              if (!locationData || Array.isArray(locationData)) {
                return;
              }

              form.setFieldsValue({
                venueName: locationData.location,
                latitude: Number(locationData.lat),
                longitude: Number(locationData.lon),
              });
            }}
          />
        </Form.Item>

        <Form.Item name="latitude" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="longitude" hidden>
          <Input />
        </Form.Item>

        <Form.Item label="Partner Blood Bank" name="partnerBloodBank">
          <Input disabled={readOnly} />
        </Form.Item>

        <Form.Item label="Donors Required" name="donorsRequired">
          <InputNumber style={{ width: "100%" }} min={1} disabled={readOnly} />
        </Form.Item>

        <Form.Item label="Event Image">
          <Space direction="vertical" style={{ width: "100%" }}>
            {!readOnly && (
              <Upload
                maxCount={1}
                beforeUpload={handleUpload}
                showUploadList
                onRemove={() => {
                  form.setFieldValue("imageFilekey", undefined);

                  return true;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            )}

            <Form.Item name="imageFilekey" noStyle>
              <Input hidden />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea rows={4} disabled={readOnly} />
        </Form.Item>

        {!readOnly && (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Event
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
}
