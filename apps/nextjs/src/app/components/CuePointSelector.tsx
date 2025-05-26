"use client";

import type { Track } from "@spotify/web-api-ts-sdk";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Slider } from "@cued/ui";
import { Button } from "@cued/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@cued/ui/dialog";
import { toast } from "@cued/ui/toast";

import { useTRPC } from "~/trpc/react";
import { pauseTrack, playTrack } from "./spotify/helpers";
import { PlayerControlsComponent } from "./spotify/player-controls";
import { useSpotifyPlayer } from "./spotify/use-spotify-player";

interface CuePointSelectorProps {
  track: Track;
  accessToken: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const CuePointSelector = ({
  track,
  accessToken,
  open,
  onOpenChange: onOpenChangeProp,
}: CuePointSelectorProps) => {
  const trpc = useTRPC();
  const { mutateAsync: insertTrack, isPending } = useMutation(
    trpc.spotify.insertTrack.mutationOptions(),
  );
  const { deviceId, playerState, player } = useSpotifyPlayer(accessToken);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(track.duration_ms);
  const [currentPosition, setCurrentPosition] = useState(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValuesRef = useRef<[number, number]>([0, track.duration_ms]);
  const positionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onOpenChange = useCallback(
    (open: boolean) => {
      onOpenChangeProp(open);
      if (!open) {
        void pauseTrack(accessToken, deviceId);
      }
    },
    [onOpenChangeProp, accessToken, deviceId],
  );

  useEffect(() => {
    if (accessToken && deviceId) {
      void playTrack(accessToken, deviceId, track.uri, 0, player);
    }
  }, [accessToken, deviceId, track.uri, player]);

  useEffect(() => {
    if (!playerState.isPlayingCorrectTrack) return;

    // Update current position when playerState changes
    setCurrentPosition(playerState.position);
    lastUpdateTimeRef.current = Date.now();

    // Clear any existing position update interval
    if (positionUpdateIntervalRef.current) {
      clearInterval(positionUpdateIntervalRef.current);
    }

    // If we're playing the correct track and not paused, start updating position
    if (!playerState.isPaused) {
      positionUpdateIntervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - lastUpdateTimeRef.current;
        setCurrentPosition((prev) => prev + elapsedMs);
        lastUpdateTimeRef.current = Date.now();
      }, 100);
    }

    return () => {
      if (positionUpdateIntervalRef.current) {
        clearInterval(positionUpdateIntervalRef.current);
      }
    };
  }, [
    playerState.isPlayingCorrectTrack,
    playerState.isPaused,
    playerState.position,
  ]);

  const handlePlayPause = useCallback(async () => {
    if (!accessToken || !deviceId) return;
    if (playerState.isPaused) {
      await playTrack(accessToken, deviceId, track.uri, start, player);
    } else {
      await pauseTrack(accessToken, deviceId);
    }
  }, [accessToken, deviceId, track.uri, playerState.isPaused, start, player]);

  const handleSliderChange = useCallback(
    (values: [number, number]) => {
      const [newStart, newEnd] = values;
      const [oldStart, oldEnd] = [start, end];

      // Determine which thumb was moved
      const startThumbMoved = newStart !== oldStart;
      const endThumbMoved = newEnd !== oldEnd;

      // Update state first
      setStart(newStart);
      setEnd(newEnd);

      // Store the current values
      lastValuesRef.current = [newStart, newEnd];

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        // Only proceed if the values haven't changed since we started the timer
        if (
          lastValuesRef.current[0] === newStart &&
          lastValuesRef.current[1] === newEnd
        ) {
          // Handle seeking based on which thumb was moved
          if (startThumbMoved) {
            void playTrack(accessToken, deviceId, track.uri, newStart, player);
          } else if (endThumbMoved) {
            const seekPosition = Math.max(0, newEnd - 3000);
            void playTrack(
              accessToken,
              deviceId,
              track.uri,
              seekPosition,
              player,
            );
          }
        }
      }, 100);
    },
    [accessToken, deviceId, track.uri, start, end, player],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const controls = {
    handlePlayPause,
    handleSliderChange,
    formatTime,
  };

  // if (!accessToken || !deviceId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{track.name}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {track.artists.map((artist) => artist.name).join(", ")}
          {" | "}
          {track.album.name}
        </DialogDescription>
        <div className="py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="">{formatTime(0)}</span>
            <div className="relative flex-1">
              <Slider
                value={[start, end]}
                min={0}
                max={playerState.duration || track.duration_ms}
                step={1000}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              {playerState.isPlayingCorrectTrack && (
                <div
                  className="absolute -top-3 -z-10 h-8 w-0.5 -translate-x-1/2 bg-red-500"
                  style={{
                    left: `${(currentPosition / (playerState.duration || track.duration_ms)) * 100}%`,
                  }}
                />
              )}
            </div>
            <span>{formatTime(playerState.duration || track.duration_ms)}</span>
          </div>
        </div>
        <DialogFooter className="flex w-full items-center !justify-between">
          <PlayerControlsComponent
            controls={controls}
            isPaused={playerState.isPaused}
          />
          <Button
            size="lg"
            className="h-7"
            disabled={isPending}
            onClick={() => {
              void insertTrack({
                trackId: track.uri,
                preferredStart: start,
                preferredEnd: end,
              }).then(({ result }) => {
                toast.success(
                  `${result === "created" ? "Set" : "Updated"} cue points for ${track.name}!`,
                );
                onOpenChange(false);
              });
            }}
          >
            Save track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CuePointSelector;
