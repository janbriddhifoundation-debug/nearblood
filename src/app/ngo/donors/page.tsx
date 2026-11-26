"use client";

import NgoDonorsTable from "@/components/NgoDonorsTable";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { InteractionOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, message } from "antd";
import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
const { Search } = Input;
import * as Sentry from "@sentry/nextjs";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState([]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/ngo/donors`);
      setDonors(data?.donors);
    } catch (error) {
      Sentry.captureException(error);
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  return (
    <div style={{ padding: 32, maxWidth: 1320, margin: "0 auto" }}>
      <div className="text-2xl font-semibold mb-10">Donors Management</div>

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <Search
          placeholder="input search text"
          onSearch={() => {}}
          allowClear
          className="!w-[250px]"
        />

        <div className="flex gap-2 flex-wrap">
          <Link href={"/ngo/donors/add"}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Donor
            </Button>
          </Link>
          <Button icon={<InteractionOutlined />}>Status</Button>
        </div>
      </div>

      <NgoDonorsTable loading={loading} donors={donors} />
    </div>
  );
};

export default Page;
