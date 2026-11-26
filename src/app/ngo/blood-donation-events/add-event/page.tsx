"use client";

import React, { useState } from "react";
import axios from "axios";
import { App, Modal } from "antd";
import { useRouter } from "next/navigation";

import NgoEventForm, { NgoEventFormValues } from "@/components/NgoEventForm";

import { getErrorMessage } from "@/utils/getErrorMessage";

function Page() {
  const router = useRouter();

  const { message } = App.useApp();

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  const [pendingValues, setPendingValues] = useState<NgoEventFormValues | null>(
    null,
  );

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values: NgoEventFormValues) => {
    setPendingValues(values);

    setConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingValues) {
      return;
    }

    try {
      setSaving(true);

      await axios.post("/api/v1/ngo/events/add-events", pendingValues);

      message.success("Event created successfully.");

      router.push("/ngo/blood-donation-events");
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);

      setConfirmModalOpen(false);

      setPendingValues(null);
    }
  };

  return (
    <>
      <div
        style={{
          padding: 32,
          maxWidth: 1320,
          margin: "0 auto",
        }}
      >
        <div className="text-2xl font-semibold mb-5">Create Event</div>

        <div className="text-sm leading-[22px] text-gray-600 mb-10">
          Create and publish a new blood donation event.
        </div>

        <NgoEventForm mode="create" onSubmit={handleSubmit} />
      </div>

      <Modal
        title="Confirm Event Creation"
        open={isConfirmModalOpen}
        centered
        okText="Yes, Create Event"
        cancelText="Review Again"
        confirmLoading={saving}
        onCancel={() => {
          setConfirmModalOpen(false);
        }}
        onOk={handleConfirmSave}
      >
        <p>Please review all event details before continuing.</p>

        <p>
          Clicking <strong>Yes, Create Event</strong> will save this event to
          the database.
        </p>
      </Modal>
    </>
  );
}

export default Page;
