import { authRouter } from "./router/auth";
import { queueRouter } from "./router/queue";
import { spotifyRouter } from "./router/spotify";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  spotify: spotifyRouter,
  queue: queueRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
