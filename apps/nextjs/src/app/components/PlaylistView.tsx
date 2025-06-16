/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@cued/api";

import { useTRPC } from "~/trpc/react";

interface PlaylistViewProps {
  playlistId: string;
  onTrackSelected: (
    track: RouterOutputs["spotify"]["search"]["tracks"][number],
  ) => void;
}

const PlaylistView = ({ playlistId, onTrackSelected }: PlaylistViewProps) => {
  const trpc = useTRPC();

  const { data: tracks, isLoading: isFetchingTracks } = useQuery(
    trpc.spotify.getPlaylistTracks.queryOptions({ playlistId }),
  );

  if (isFetchingTracks) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, index) => (
      <div key={index} className="h-24 w-full animate-pulse bg-muted" />
    ));
  }

  if (!tracks) {
    return (
      <div className="col-span-full grid h-96 w-full place-content-center border border-dashed">
        <p className="text-sm text-muted-foreground">No tracks found</p>
      </div>
    );
  }

  return tracks.map(
    (track: RouterOutputs["spotify"]["search"]["tracks"][number]) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!track) return null;

      return (
        <button
          key={track.id}
          onClick={() => onTrackSelected(track)}
          className="flex w-full items-center gap-4 border p-4 transition-all hover:scale-105 hover:border-primary sm:w-96 lg:w-[500px]"
        >
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          {track.album?.images[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.album.name}
              className="h-12 w-12"
            />
          )}
          <div className="flex flex-col items-start">
            <span className="line-clamp-1 font-medium">{track.name}</span>
            <span className="text-sm text-muted-foreground">
              {track.artists.map((artist) => artist.name).join(", ")}
            </span>
          </div>
        </button>
      );
    },
  );
};

export default PlaylistView;
