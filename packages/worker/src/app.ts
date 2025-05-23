import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { env } from "@cued/auth/env";

import { getAccessToken, getResolvedTrackData } from "./helpers";

// Underlying polling function
async function poll(sdk: SpotifyApi, pollInterval: number) {
  // Get the currently playing track and the queue
  const {
    item: track,
    currently_playing_type,
    repeat_state,
    progress_ms,
  } = await sdk.player.getCurrentlyPlayingTrack();

  // If we're not playing a track or repeat is on, no further action is needed
  if (currently_playing_type !== "track" || repeat_state !== "off") {
    return;
  }

  const { preferredEnd } = await getResolvedTrackData(track);

  // If the track won't end before the next poll, no further action is needed
  if (preferredEnd > progress_ms + pollInterval) {
    return;
  }

  // Get the next track in the queue
  const { queue } = await sdk.player.getUsersQueue();
  const nextTrack = queue[0];

  // If there is no next track, no further action is needed
  if (!nextTrack) {
    return;
  }

  // Get the next track's data
  const { preferredStart: nextPreferredStart } =
    await getResolvedTrackData(nextTrack);

  // Play the next track, starting at the appropriate start time
  await sdk.player.skipToNext("");
  await sdk.player.seekToPosition(nextPreferredStart);
}

interface WorkerConfig {
  pollInterval: number;
  runs: number;
  userId: string;
}

export default async function worker({
  pollInterval,
  runs,
  userId,
}: WorkerConfig) {
  // Get the access token and initialize the SDK for the user
  const accessToken = await getAccessToken(userId);
  const sdk = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, accessToken);

  // Start the polling loop
  while (runs > 0) {
    // Wait for min(pollInterval, current poll execution time) before the next poll
    await Promise.all([
      poll(sdk, pollInterval),
      new Promise((resolve) => setTimeout(resolve, pollInterval)),
    ]);
    runs--;
  }
}
