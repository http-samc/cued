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
    <button
      onClick={controls.handlePlayPause}
      className="rounded-full bg-black p-2 text-white hover:bg-gray-800"
    >
      {isPaused ? "▶" : "⏸"}
    </button>
  );
};
