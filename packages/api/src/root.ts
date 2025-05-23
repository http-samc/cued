import { authRouter } from "./router/auth";
import { spotifyRouter } from "./router/spotify";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  spotify: spotifyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
