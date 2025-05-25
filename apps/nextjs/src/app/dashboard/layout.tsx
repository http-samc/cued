import React from "react";
import { headers } from "next/headers";
// import Image from "next/image";
import { redirect } from "next/navigation";

import client from "@cued/auth/client";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { data: session } = await client.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-full flex-col">
      {/* <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <h1 className="font-mono text-xl">Cued</h1>
        <Image
          src={session.user.image!}
          alt={session.user.name!}
          width={32}
          height={32}
          className="rounded-full"
        />
      </div> */}
      <div className="grid w-full flex-1 place-content-center">
        <div className="w-screen lg:w-auto">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
