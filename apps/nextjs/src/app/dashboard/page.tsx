"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LucideArrowLeft } from "lucide-react";
import { useDebounce } from "use-debounce";

import type { RouterOutputs } from "@cued/api";
import client from "@cued/auth/client";
import { Input } from "@cued/ui/input";
import { Label } from "@cued/ui/label";

import { useTRPC } from "~/trpc/react";
import CuePointSelector from "../components/CuePointSelector";
import MediaCard from "../components/MediaCard";
import PlaylistView from "../components/PlaylistView";

const DashboardPage = () => {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<
    RouterOutputs["spotify"]["search"]["tracks"][number] | null
  >(null);
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
      <div className="flex w-full flex-col items-center space-y-8 p-8">
        <motion.div layoutId="search" className="mx-auto space-y-1">
          <Label htmlFor="search" className="text-xs">
            Search Spotify
          </Label>
          <Input
            id="search"
            placeholder="e.g. Sweet Child O' Mine"
            className="w-64 rounded-none focus-visible:ring-primary sm:w-96 lg:w-[500px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>
        <div className="w-full max-w-sm space-y-4 lg:max-w-full">
          <div className="sticky top-0 flex w-full items-center gap-2 border-b bg-background">
            {(selectedPlaylist ?? debouncedQuery) && (
              <button
                className="transition-transform hover:-translate-x-0.5"
                onClick={() => {
                  setSelectedPlaylist(null);
                  setQuery("");
                }}
              >
                <LucideArrowLeft size={16} />
              </button>
            )}
            <h3 className="line-clamp-1 text-xl font-semibold">
              {debouncedQuery && <>Results for "{debouncedQuery}"</>}
              {!debouncedQuery && !selectedPlaylist && "Your playlists"}
              {!debouncedQuery && selectedPlaylist?.name}
            </h3>
          </div>
          <div className="mx-auto grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {searchResults?.tracks.map((track) => (
              <MediaCard
                key={track.id}
                item={track}
                onClick={() => setSelectedTrack(track)}
              />
            ))}
            {searchResults === undefined &&
              !isFetchingSearchResults &&
              !selectedPlaylist &&
              playlists?.map((playlist) => (
                <MediaCard
                  key={playlist.id}
                  item={playlist}
                  onClick={() => {
                    setQuery("");
                    setSelectedPlaylist({
                      id: playlist.id,
                      name: playlist.name,
                    });
                  }}
                />
              ))}
            {(isFetchingSearchResults || isFetchingPlaylists) &&
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, i) => (
                <div key={i} className="h-64 w-48 space-y-2 border p-2">
                  <div className="h-44 w-full animate-pulse bg-gray-600" />
                  <div className="h-6 w-36 animate-pulse bg-gray-600 delay-100"></div>
                  <div className="h-3 w-32 animate-pulse bg-gray-600 delay-200"></div>
                </div>
              ))}
            {!isFetchingSearchResults && debouncedQuery && !searchResults && (
              <div className="col-span-full grid h-96 w-full place-content-center border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No results found.
                </p>
              </div>
            )}
            {selectedPlaylist && (
              <div className="col-span-full flex w-full flex-col gap-2">
                <PlaylistView
                  playlistId={selectedPlaylist.id}
                  onTrackSelected={setSelectedTrack}
                />
              </div>
            )}
          </div>
        </div>
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
