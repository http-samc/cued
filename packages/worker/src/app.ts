import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { env } from "@cued/auth/env";

import { getResolvedTrackData } from "./helpers";

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
  // Recursively call the worker for the next poll
  const next = () => {
    setTimeout(async () => {
      await worker({ pollInterval, runs: runs - 1, userId });
    }, pollInterval);
  };

  const sdk = SpotifyApi.withClientCredentials(
    env.SPOTIFY_CLIENT_ID,
    env.SPOTIFY_CLIENT_SECRET,
  );

  // Get the currently playing track and the queue
  const {
    item: track,
    currently_playing_type,
    repeat_state,
    progress_ms,
  } = await sdk.player.getCurrentlyPlayingTrack();

  // If we're not playing a track or repeat is on, no further action is needed
  if (currently_playing_type !== "track" || repeat_state !== "off") {
    return next();
  }

  const { preferredEnd } = await getResolvedTrackData(track);

  // If the track won't end before the next poll, no further action is needed
  if (preferredEnd > progress_ms + pollInterval) {
    return next();
  }

  // Get the next track in the queue
  const { queue } = await sdk.player.getUsersQueue();
  const nextTrack = queue[0];

  // If there is no next track, no further action is needed
  if (!nextTrack) {
    return next();
  }

  // Get the next track's data
  const { preferredStart: nextPreferredStart } =
    await getResolvedTrackData(nextTrack);

  // Play the next track, starting at the appropriate start time
  await sdk.player.skipToNext("");
  await sdk.player.seekToPosition(nextPreferredStart);
}
