"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import type { RouterOutputs } from "@cued/api";
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

import { getQueryClient, useTRPC } from "~/trpc/react";
import { pauseTrack, playTrack } from "./spotify/helpers";
import { PlayerControlsComponent } from "./spotify/player-controls";

interface CuePointSelectorProps {
  track: RouterOutputs["spotify"]["search"]["tracks"][number];
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
  const queryClient = getQueryClient();

  const { mutateAsync: insertTrack, isPending } = useMutation(
    trpc.spotify.insertTrack.mutationOptions({
      onSuccess: () => {
        console.log("Track Data Updated: Invalidating locally cached queries");
        void queryClient.invalidateQueries().then(() => {
          console.log("Queries invalidated");
        });
      },
    }),
  );
  const [isPaused, setIsPaused] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(
    track.preferredStart ?? 0,
  );
  const [start, setStart] = useState(track.preferredStart ?? 0);
  const [end, setEnd] = useState(track.preferredEnd ?? track.duration_ms);

  const onOpenChange = useCallback(
    (open: boolean) => {
      onOpenChangeProp(open);
      if (!open) {
        void pauseTrack(accessToken, null);
        setIsPaused(true);
      }
    },
    [onOpenChangeProp, accessToken],
  );

  useEffect(() => {
    if (accessToken) {
      void playTrack(accessToken, null, track.uri, start);
      setIsPaused(false);
      setCurrentPosition(start);
    }
  }, [accessToken, track.uri, start]);

  useEffect(() => {
    if (isPaused) return;
    // Update current position every 100ms while playing
    const interval = setInterval(() => {
      setCurrentPosition((prev) => {
        if (prev + 100 >= end) {
          setIsPaused(true);
          void pauseTrack(accessToken, null);
          return end;
        }
        return prev + 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused, end, accessToken]);

  const handlePlayPause = useCallback(async () => {
    if (!accessToken) return;
    if (isPaused) {
      await playTrack(accessToken, null, track.uri, currentPosition);
      setIsPaused(false);
    } else {
      await pauseTrack(accessToken, null);
      setIsPaused(true);
    }
  }, [accessToken, isPaused, track.uri, currentPosition]);

  const handleSliderChange = useCallback(
    (values: [number, number]) => {
      const [newStart, newEnd] = values;
      const startThumbMoved = newStart !== start;
      const endThumbMoved = newEnd !== end;

      setStart(newStart);
      setEnd(newEnd);

      let playPosition = newStart;
      if (startThumbMoved) {
        playPosition = newStart;
      } else if (endThumbMoved) {
        playPosition = Math.max(0, newEnd - 3000);
      }
      setCurrentPosition(playPosition);
      if (!isPaused && accessToken) {
        void playTrack(accessToken, null, track.uri, playPosition);
      }
    },
    [accessToken, isPaused, track.uri, start, end],
  );

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
                max={track.duration_ms}
                step={1000}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              {!isPaused && (
                <div
                  className="absolute -top-3 -z-10 h-8 w-0.5 -translate-x-1/2 bg-red-500"
                  style={{
                    left: `${(currentPosition / track.duration_ms) * 100}%`,
                  }}
                />
              )}
            </div>
            <span>{formatTime(track.duration_ms)}</span>
          </div>
        </div>
        <DialogFooter className="flex w-full items-center !justify-between">
          <PlayerControlsComponent controls={controls} isPaused={isPaused} />
          <Button
            size="lg"
            className="h-7 w-32"
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
            {isPending ? (
              <span className="flex items-center gap-3">
                <span className="h-2 w-2 animate-ping bg-black" />
                <span className="h-2 w-2 animate-ping bg-black delay-150" />
                <span className="h-2 w-2 animate-ping bg-black delay-300" />
              </span>
            ) : (
              "Save track"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CuePointSelector;
