import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import client from "@cued/auth/client";

import SessionButton from "../components/SessionButton";
import UserButton from "../components/UserButton";

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
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <Link href="/" className="font-mono text-xl">
          Cued
        </Link>
        <div className="flex items-center gap-2">
          <SessionButton />
          <UserButton
            name={session.user.name}
            image={`${session.user.image}`}
          />
        </div>
      </div>
      <div className="grid w-full flex-1 place-content-center">
        <div className="w-screen lg:w-auto">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
