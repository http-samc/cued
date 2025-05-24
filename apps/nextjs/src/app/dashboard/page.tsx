"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Track } from "@spotify/web-api-ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";

import client from "@cued/auth/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@cued/ui/dialog";
import { Input } from "@cued/ui/input";
import { Label } from "@cued/ui/label";

import { useTRPC } from "~/trpc/react";
import CuePointSelector from "../components/CuePointSelector";

const DashboardPage = () => {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getAccessToken = async () => {
    const { data } = await client.getAccessToken({
      providerId: "spotify",
    });
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
    }
  };
  useEffect(() => {
    void getAccessToken();
  }, []);

  const { data: searchResults, isLoading: isFetchingSearchResults } = useQuery(
    trpc.spotify.search.queryOptions(
      {
        query: debouncedQuery,
      },
      {
        enabled: !!debouncedQuery,
      },
    ),
  );

  const { data: playlists, isLoading: isFetchingPlaylists } = useQuery(
    trpc.spotify.getCurrentUsersPlaylists.queryOptions(),
  );

  return (
    <>
      <div className="flex flex-col items-center space-y-16 p-8">
        <motion.div layoutId="search" className="mx-auto space-y-1">
          <Label htmlFor="search">Find a song</Label>
          <Input
            id="search"
            placeholder="e.g. Sweet Child O' Mine"
            className="rounded-none sm:w-96"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {searchResults?.tracks.map((track) => (
            <button
              key={track.id}
              className="h-64 w-48 space-y-2 border p-2 hover:scale-105"
              onClick={() => {
                setSelectedTrack(track);
              }}
            >
              <Image
                src={track.album.images[0]?.url!}
                width={190}
                height={180}
                alt={track.name}
              />
              <div className="space-y-1">
                <p className="line-clamp-2 text-sm">{track.name}</p>
                <p className="line-clamp-1 text-xs opacity-80">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
            </button>
          ))}
          {searchResults === undefined &&
            !isFetchingSearchResults &&
            playlists?.map((playlist) => (
              <li
                key={playlist.id}
                className="h-64 w-48 space-y-2 border p-2 hover:scale-105"
              >
                <img
                  src={playlist.images[0]?.url!}
                  className="aspect-square overflow-hidden object-cover"
                  alt={playlist.name}
                />
                <div className="space-y-1">
                  <p className="line-clamp-2 text-sm">{playlist.name}</p>
                </div>
              </li>
            ))}
          {(isFetchingSearchResults || isFetchingPlaylists) &&
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, i) => (
              <li key={i} className="h-64 w-48 space-y-2 border p-2">
                <div className="h-44 w-full animate-pulse bg-gray-600" />
                <div className="h-6 w-36 animate-pulse bg-gray-600 delay-100"></div>
                <div className="h-3 w-32 animate-pulse bg-gray-600 delay-200"></div>
              </li>
            ))}
        </ul>
      </div>
      <Dialog
        open={!!selectedTrack}
        onOpenChange={(open) => !open && setSelectedTrack(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTrack?.name}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {selectedTrack?.artists.map((artist) => artist.name).join(", ")}
            {" | "}
            {selectedTrack?.album.name}
          </DialogDescription>
          <CuePointSelector
            spotifyUri={selectedTrack?.uri!}
            startMs={0}
            endMs={selectedTrack?.duration_ms!}
            accessToken={accessToken}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
