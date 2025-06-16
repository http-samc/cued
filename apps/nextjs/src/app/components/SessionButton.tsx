"use client";

import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@cued/ui/button";

import { useTRPC } from "~/trpc/react";
import { formatTime } from "./CuePointSelector";

const SessionButton = () => {
  const trpc = useTRPC();
  const { data: session, refetch } = useQuery(
    trpc.queue.getUserJob.queryOptions(undefined, {
      refetchInterval: 1000 * 60,
    }),
  );
  const { mutateAsync: toggleSession, isPending: isTogglingSession } =
    useMutation(trpc.queue.toggleJob.mutationOptions());

  return (
    <Button
      onClick={() => void toggleSession().then(() => void refetch())}
      disabled={isTogglingSession || !!session}
      className="h-7 !text-xs"
    >
      {session
        ? `${formatTime(session.timeRemaining).split(":")[0]}m left`
        : "Start session"}
    </Button>
  );
};

export default SessionButton;
