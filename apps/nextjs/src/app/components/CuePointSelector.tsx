"use client";

import React, { useEffect } from "react";

import { Label, Slider } from "@cued/ui";

import { playTrack } from "./spotify/helpers";
import { PlayerControlsComponent } from "./spotify/player-controls";
import { useSpotifyPlayer } from "./spotify/use-spotify-player";

interface CuePointSelectorProps {
  spotifyUri: string;
  startMs: number;
  endMs: number;
  accessToken: string | null;
}

const CuePointSelector = ({
  spotifyUri,
  startMs,
  endMs,
  accessToken,
}: CuePointSelectorProps) => {
  const { player, deviceId } = useSpotifyPlayer(accessToken);
  useEffect(() => {
    if (accessToken && deviceId) {
      void playTrack(accessToken, deviceId, spotifyUri, startMs);
    }
  }, [accessToken, deviceId, spotifyUri, startMs]);

  if (!accessToken || !deviceId) return null;

  return (
    <div className="space-y-4">
      {/* <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Start Time</Label>
          <div className="text-sm font-medium">
            {controls.formatTime(state.start)}
          </div>
        </div>
        <div className="space-y-1">
          <Label>End Time</Label>
          <div className="text-sm font-medium">
            {controls.formatTime(state.end)}
          </div>
        </div>
      </div> */}

      <div className="space-y-2">
        <Slider
          value={[0, 50000]}
          min={0}
          max={50000}
          step={1000}
          // onValueChange={controls.handleSliderChange}
          className="w-full"
        />
        {/* <div className="flex justify-between text-xs text-muted-foreground">
          <span>{controls.formatTime(0)}</span>
          <span>{controls.formatTime(state.duration || endMs)}</span>
        </div> */}
      </div>

      {/* {state.isPlayerReady && (
        <PlayerControlsComponent
          controls={controls}
          isPaused={state.isPaused}
        />
      )} */}
    </div>
  );
};

export default CuePointSelector;
