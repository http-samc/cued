import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { env } from "@cued/auth/env";

import { getAccessToken } from "./helpers";
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
  const accessToken = await getAccessToken(userId);
  const sdk = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, accessToken);

  // Log the user's display name
  const user = await sdk.currentUser.profile();
  console.debug(`Initialized worker for user "${user.display_name}".`);

  // Start the polling loop
  while (runs > 0) {
    // Wait for min(pollInterval, current poll execution time) before the next poll
    await Promise.all([
      poll({ sdk, pollInterval, userId }),
      new Promise((resolve) => setTimeout(resolve, pollInterval)),
    ]);
    runs--;
  }
}
