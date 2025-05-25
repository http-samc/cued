import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../trpc";

export const queueRouter = {
  getUserJob: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;

    return {
      userId,
      jobStartedAt: Date.now(),
      jobEndsAt: Date.now() + 1000 * 60 * 60,
    };
  }),
  toggleJob: protectedProcedure.mutation(({ ctx }) => {
    const userId = ctx.session.user.id;

    return {
      userId,
      success: true,
    };
  }),
} satisfies TRPCRouterRecord;
