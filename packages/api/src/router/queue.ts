import type { TRPCRouterRecord } from "@trpc/server";
import { Queue } from "bullmq";

import type { WorkerConfig } from "@cued/worker";
import { redis as connection } from "@cued/db";

import { protectedProcedure } from "../trpc";

const queue = new Queue<WorkerConfig>("cued", {
  connection,
});

export const queueRouter = {
  getUserJob: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const job = await queue.getJob(userId);

    if (!job) {
      return null;
    }

    const isActive = await job.isActive();
    if (!isActive) {
      await job.remove();
      return null;
    }

    const timeElapsed = Date.now() - job.timestamp;

    return {
      userId,
      timeRemaining: 1000 * 60 * 60 - timeElapsed,
    };
  }),
  toggleJob: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const job = await queue.getJob(userId);

    if (!job) {
      await queue.add(
        userId,
        {
          userId,
          pollInterval: 1000 * 5, // 5 seconds
          runs: 12 * 60 * 2, // 2 hours worth of runs
        },
        {
          jobId: userId,
        },
      );
      return { action: "created" };
    } else {
      await job.remove();
      return { action: "removed" };
    }
  }),
} satisfies TRPCRouterRecord;
