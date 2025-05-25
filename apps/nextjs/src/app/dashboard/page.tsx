"use client";

import type { Track } from "@spotify/web-api-ts-sdk";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";

import client from "@cued/auth/client";
import { Input } from "@cued/ui/input";
import { Label } from "@cued/ui/label";

import { useTRPC } from "~/trpc/react";
import CuePointSelector from "../components/CuePointSelector";
import MediaCard from "../components/MediaCard";

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
          <Label htmlFor="search" className="text-xs">
            Search Spotify
          </Label>
          <Input
            id="search"
            placeholder="e.g. Sweet Child O' Mine"
            className="rounded-none sm:w-96 lg:w-[500px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>
        <ul className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {searchResults?.tracks.map((track) => (
            <MediaCard
              key={track.id}
              item={track}
              onClick={() => setSelectedTrack(track)}
            />
          ))}
          {searchResults === undefined &&
            !isFetchingSearchResults &&
            playlists?.map((playlist) => (
              <MediaCard key={playlist.id} item={playlist} />
            ))}
          {(isFetchingSearchResults || isFetchingPlaylists) &&
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, i) => (
              <li key={i} className="h-64 w-48 space-y-2 border p-2">
                <div className="h-44 w-full animate-pulse bg-gray-600" />
                <div className="h-6 w-36 animate-pulse bg-gray-600 delay-100"></div>
                <div className="h-3 w-32 animate-pulse bg-gray-600 delay-200"></div>
              </li>
            ))}
          {!isFetchingSearchResults && debouncedQuery && !searchResults && (
            <div className="col-span-full grid h-96 w-full place-content-center border border-dashed">
              <p className="text-sm text-muted-foreground">No results found.</p>
            </div>
          )}
        </ul>
      </div>
      {selectedTrack && (
        <CuePointSelector
          track={selectedTrack}
          accessToken={accessToken}
          open={!!selectedTrack}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTrack(null);
            }
          }}
        />
      )}
    </>
  );
};

export default DashboardPage;
