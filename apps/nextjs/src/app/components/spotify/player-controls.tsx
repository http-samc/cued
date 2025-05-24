import React from "react";

import type { PlayerControls as PlayerControlsType } from "./types";

interface PlayerControlsProps {
  controls: PlayerControlsType;
  isPaused: boolean;
}

export const PlayerControlsComponent: React.FC<PlayerControlsProps> = ({
  controls,
  isPaused,
}) => {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={controls.handlePreviousTrack}
        className="rounded-full bg-black p-2 text-white hover:bg-gray-800"
      >
        ⏮
      </button>
      <button
        onClick={controls.handlePlayPause}
        className="rounded-full bg-black p-2 text-white hover:bg-gray-800"
      >
        {isPaused ? "▶" : "⏸"}
      </button>
      <button
        onClick={controls.handleNextTrack}
        className="rounded-full bg-black p-2 text-white hover:bg-gray-800"
      >
        ⏭
      </button>
    </div>
  );
};
