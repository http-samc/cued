import type { TRPCRouterRecord } from "@trpc/server";

// import { auth } from "@cued/auth";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!";
  }),
  signOut: protectedProcedure.mutation((opts) => {
    if (!opts.ctx.token) {
      return { success: false };
    }
    // await auth.api.signOut({
    //   headers: opts.he
    // });
    return { success: true };
  }),
} satisfies TRPCRouterRecord;
