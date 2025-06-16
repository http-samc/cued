/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

import type { WorkerConfig } from "./worker";
import { getResolvedTrackData } from "./helpers";

interface PollerConfig {
  sdk: SpotifyApi;
  userId: WorkerConfig["userId"];
  pollInterval: WorkerConfig["pollInterval"];
}

// Underlying polling function
export default async function poll({
  sdk,
  userId,
  pollInterval,
}: PollerConfig) {
  // Get the currently playing track
  const data = await sdk.player.getCurrentlyPlayingTrack();

  // If we're not playing anything, no further action is needed
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!data?.is_playing) {
    console.debug("Terminating poll: no currently playing track");
    return;
  }

  const { item: track, currently_playing_type, progress_ms } = data;

  // If we're not playing a track, no further action is needed
  if (currently_playing_type !== "track") {
    console.debug("Terminating poll: not playing a track");
    return;
  }

  const { preferredEnd } = await getResolvedTrackData(userId, track);

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
  const { preferredStart: nextPreferredStart } = await getResolvedTrackData(
    userId,
    nextTrack,
  );

  // Play the next track
  try {
    await sdk.player.skipToNext("");
  } catch (error) {
    // This errors due to a Spotify SDK serialization issue, but it works
  }

  // Seek to the appropriate start time
  try {
    await sdk.player.seekToPosition(nextPreferredStart);
  } catch (error) {
    // This errors due to a Spotify SDK serialization issue, but it works
  }
}
