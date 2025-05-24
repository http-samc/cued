"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Label, Slider } from "@cued/ui";
import { Button } from "@cued/ui/button";
import { toast } from "@cued/ui/toast";

import { useTRPC } from "~/trpc/react";
import { pauseTrack, playTrack } from "./spotify/helpers";
import { PlayerControlsComponent } from "./spotify/player-controls";
import { useSpotifyPlayer } from "./spotify/use-spotify-player";

interface CuePointSelectorProps {
  spotifyUri: string;
  startMs: number;
  endMs: number;
  accessToken: string | null;
}

interface PlayerState {
  isPlayerReady: boolean;
  isPaused: boolean;
  duration: number;
  start: number;
  end: number;
  position: number;
  isPlayingCorrectTrack: boolean;
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const CuePointSelector = ({
  spotifyUri,
  startMs,
  endMs,
  accessToken,
}: CuePointSelectorProps) => {
  const trpc = useTRPC();
  const { mutateAsync: insertTrack } = useMutation(
    trpc.spotify.insertTrack.mutationOptions(),
  );
  const { player, deviceId } = useSpotifyPlayer(accessToken);
  const [state, setState] = useState<PlayerState>({
    isPlayerReady: false,
    isPaused: true,
    duration: endMs,
    start: startMs,
    end: endMs,
    position: 0,
    isPlayingCorrectTrack: false,
  });
  const debounceTimerRef = useRef<NodeJS.Timeout>(null!);
  const lastValuesRef = useRef<[number, number]>([startMs, endMs]);
  const positionUpdateIntervalRef = useRef<NodeJS.Timeout>(null!);

  useEffect(() => {
    if (accessToken && deviceId) {
      void playTrack(accessToken, deviceId, spotifyUri, startMs);
    }
  }, [accessToken, deviceId, spotifyUri, startMs]);

  useEffect(() => {
    if (!player) return;

    const handleReady = () => {
      setState((prev) => ({ ...prev, isPlayerReady: true }));
    };

    const handleStateChange = (state: Spotify.PlaybackState) => {
      const isPlayingCorrectTrack =
        state.track_window?.current_track?.uri === spotifyUri;
      setState((prev) => ({
        ...prev,
        isPaused: state.paused,
        duration: state.duration,
        position: state.position,
        isPlayingCorrectTrack,
      }));

      // Clear any existing position update interval
      if (positionUpdateIntervalRef.current) {
        clearInterval(positionUpdateIntervalRef.current);
      }

      // If we're playing the correct track and not paused, start updating position
      if (isPlayingCorrectTrack && !state.paused) {
        const startTime = Date.now();
        const startPosition = state.position;

        positionUpdateIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          setState((prev) => ({
            ...prev,
            position: startPosition + elapsed,
          }));
        }, 100); // Update every 100ms for smooth movement
      }
    };

    player.addListener("ready", handleReady);
    player.addListener("player_state_changed", handleStateChange);

    return () => {
      player.removeListener("ready", handleReady);
      player.removeListener("player_state_changed", handleStateChange);
      if (positionUpdateIntervalRef.current) {
        clearInterval(positionUpdateIntervalRef.current);
      }
    };
  }, [player, spotifyUri]);

  const handlePlayPause = useCallback(async () => {
    if (!accessToken || !deviceId) return;
    if (state.isPaused) {
      await playTrack(accessToken, deviceId, spotifyUri, state.start);
    } else {
      await pauseTrack(accessToken, deviceId);
    }
  }, [accessToken, deviceId, spotifyUri, state.isPaused, state.start]);

  const handleSliderChange = useCallback(
    async (values: [number, number]) => {
      console.log("Handling slider change");
      const [newStart, newEnd] = values;
      const [oldStart, oldEnd] = [state.start, state.end];

      // Determine which thumb was moved
      const startThumbMoved = newStart !== oldStart;
      const endThumbMoved = newEnd !== oldEnd;

      // Update state first
      setState((prev) => ({
        ...prev,
        start: newStart,
        end: newEnd,
      }));

      // Store the current values
      lastValuesRef.current = [newStart, newEnd];

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(async () => {
        // Only proceed if the values haven't changed since we started the timer
        if (
          lastValuesRef.current[0] === newStart &&
          lastValuesRef.current[1] === newEnd
        ) {
          console.log("Debounced slider change - values stable");
          // Handle seeking based on which thumb was moved
          if (startThumbMoved) {
            await playTrack(accessToken, deviceId, spotifyUri, newStart);
          } else if (endThumbMoved) {
            const seekPosition = Math.max(0, newEnd - 3000);
            await playTrack(accessToken, deviceId, spotifyUri, seekPosition);
          }
        }
      }, 100);
    },
    [
      player,
      state.start,
      state.end,
      state.isPaused,
      accessToken,
      deviceId,
      spotifyUri,
    ],
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

  if (!accessToken || !deviceId) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Slider
            value={[state.start, state.end]}
            min={0}
            max={state.duration || endMs}
            step={1000}
            onValueChange={handleSliderChange}
            className="w-full"
          />
          {state.isPlayingCorrectTrack && (
            <div
              className="absolute -top-3 -z-10 h-8 w-0.5 -translate-x-1/2 bg-red-500"
              style={{
                left: `${(state.position / (state.duration || endMs)) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(0)}</span>
          <span>{formatTime(state.duration || endMs)}</span>
        </div>
      </div>
      {state.isPlayerReady && (
        <PlayerControlsComponent
          controls={controls}
          isPaused={state.isPaused}
        />
      )}
      <Button
        onClick={() => {
          void insertTrack({
            trackId: spotifyUri,
            preferredStart: state.start,
            preferredEnd: state.end,
          }).then(() => {
            toast.success("Track inserted");
          });
        }}
      >
        Insert Track
      </Button>
    </div>
  );
};

export default CuePointSelector;
