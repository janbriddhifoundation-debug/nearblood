import React from "react";
import Image from "next/image";

function page() {
  return (
    <div className="min-h-screen flex flex-col px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        Support and helpdesk
      </h1>

      <p className="text-sm text-gray-500 mb-10 max-w-2xl">
        This page will be used to offer support and a helpdesk for querries.
      </p>

      <div className="w-full flex justify-center mt-20">
        <Image
          src="/underDevelopment.svg"
          alt="Under development"
          width={420}
          height={420}
          className="opacity-90"
          priority
        />
      </div>
    </div>
  );
}

export default page;
