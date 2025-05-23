import { TrackItem } from "@spotify/web-api-ts-sdk";

export const getResolvedTrackData = async (track: TrackItem) => {
  return {
    preferredStart: 750,
    preferredEnd: track.duration_ms,
  };
};
