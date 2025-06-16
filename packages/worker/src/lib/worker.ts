import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { and, eq } from "drizzle-orm";

import { env } from "@cued/auth/env";
import { db } from "@cued/db/client";
import { account } from "@cued/db/schema";

import { getAccessToken, refreshAccessToken } from "./helpers";
import poll from "./poll";

export interface WorkerConfig {
  pollInterval: number;
  runs: number;
  userId: string;
}

// Primary worker function
export default async function worker({
  pollInterval,
  runs,
  userId,
}: WorkerConfig) {
  // Get the access token and initialize the SDK for the user
  let accessToken = await getAccessToken(userId);
  let sdk = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, accessToken);

  // Get the user's account id for DB updates on refresh
  const spotifyAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "spotify")),
  });
  if (!spotifyAccount) throw new Error("No Spotify account found for user");
  const accountId = spotifyAccount.id;

  // Log the user's display name
  const user = await sdk.currentUser.profile();
  console.debug(`Initialized worker for user "${user.display_name}".`);

  // Track last refresh attempt
  let lastRefreshAttempt = 0;
  const REFRESH_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

  // Start the polling loop
  while (runs > 0) {
    try {
      // Wait for min(pollInterval, current poll execution time) before the next poll
      await Promise.all([
        poll({ sdk, pollInterval, userId }),
        new Promise((resolve) => setTimeout(resolve, pollInterval)),
      ]);
    } catch (error) {
      const now = Date.now();
      if (now - lastRefreshAttempt >= REFRESH_WINDOW_MS) {
        accessToken = await refreshAccessToken(
          env.SPOTIFY_CLIENT_ID,
          accessToken.refresh_token,
          accountId,
        );
        sdk = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, accessToken);
        lastRefreshAttempt = now;
      } else {
        // If already refreshed within the window, treat as fatal
        throw error;
      }
    }
    runs--;
  }
}
