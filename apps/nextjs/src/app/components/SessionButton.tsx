"use client";

import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@cued/ui/button";

import { useTRPC } from "~/trpc/react";
import { formatTime } from "./CuePointSelector";

const SessionButton = () => {
  const trpc = useTRPC();
  const { data: session, refetch } = useQuery(
    trpc.queue.getUserJob.queryOptions(),
  );
  const { mutateAsync: toggleSession, isPending: isTogglingSession } =
    useMutation(trpc.queue.toggleJob.mutationOptions());

  return (
    <Button
      onClick={() => void toggleSession().then(() => void refetch())}
      disabled={isTogglingSession}
      className="h-7 !text-xs"
    >
      {session
        ? `Pause (${formatTime(session.jobEndsAt - session.jobStartedAt).split(":")[0]}m left)`
        : "Start session"}
    </Button>
  );
};

export default SessionButton;
