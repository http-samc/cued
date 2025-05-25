import React from "react";
import { PauseIcon, RefreshCcwIcon } from "lucide-react";

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
      className="rounded-full !p-0 text-muted-foreground opacity-80 transition-opacity hover:opacity-50"
      onClick={controls.handlePlayPause}
    >
      {isPaused ? <RefreshCcwIcon size={18} /> : <PauseIcon size={18} />}
    </button>
  );
};
