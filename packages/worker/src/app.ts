import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { env } from "@cued/auth/env";

import { getAccessToken, getResolvedTrackData } from "./helpers";

// Underlying polling function
async function poll(sdk: SpotifyApi, pollInterval: number) {
  // Get the currently playing track and the queue
  const data = await sdk.player.getCurrentlyPlayingTrack();

  // If we're not playing anything, no further action is needed
  if (!data) {
    console.debug("Terminating poll: no currently playing track");
    return;
  }

  const {
    item: track,
    currently_playing_type,
    repeat_state,
    progress_ms,
  } = data;

  // If we're not playing a track, no further action is needed
  if (currently_playing_type !== "track") {
    console.debug("Terminating poll: not playing a track");
    return;
  }

  const { preferredEnd } = await getResolvedTrackData(track);

  console.debug(
    `Current track: ${track.name} (${progress_ms}ms/${preferredEnd}ms)`,
  );

  // If the track won't end before the next poll (2x the poll interval for safety), no further action is needed
  if (preferredEnd > progress_ms + 2 * pollInterval) {
    console.debug("Terminating poll: track won't end before next poll");
    return;
  }

  // Get the next track in the queue
  const { queue } = await sdk.player.getUsersQueue();
  const nextTrack = queue[0];

  // If there is no next track, no further action is needed
  if (!nextTrack) {
    console.debug("Terminating poll: no next track in queue");
    return;
  }

  console.debug("Next track found:", nextTrack.name);

  // Get the next track's data
  const { preferredStart: nextPreferredStart } =
    await getResolvedTrackData(nextTrack);

  // Play the next track, starting at the appropriate start time
  try {
    await sdk.player.skipToNext(null!);
    await sdk.player.seekToPosition(nextPreferredStart);
  } catch (error) {} // This errors due to a serialization issue, but it works
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

  // Log the user's display name
  const user = await sdk.currentUser.profile();
  console.debug(`Initialized worker for user "${user.display_name}".`);

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
