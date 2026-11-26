"use client";

import { Button, Modal, App } from "antd";
import { useState } from "react";

export default function ApproveNgoButton({
  ngoId,
  approvedAt,
  onApproved,
}: {
  ngoId: string;
  approvedAt: string | null;
  onApproved?: () => void; // 👈 new prop
}) {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleApprove = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/v1/admin/ngo/${ngoId}/approve`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message);
      }

      message.success("NGO Approved");

      // ✅ trigger parent update instead of router.refresh
      if (onApproved) onApproved();
    } catch (err: unknown) {
      const messageText =
        err instanceof Error ? err.message : "Something went wrong";

      message.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (approvedAt) {
      message.info("Already approved");
      return;
    }

    Modal.confirm({
      title: "Approve NGO?",
      content: "This will mark the NGO as approved.",
      okText: "Yes, Approve",
      cancelText: "Cancel",
      okButtonProps: { danger: true },

      onOk: handleApprove,
    });
  };

  return (
    <Button
      type="primary"
      danger
      loading={loading}
      disabled={!!approvedAt}
      onClick={handleClick}
    >
      Approve NGO
    </Button>
  );
}
