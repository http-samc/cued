"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type PlaybackState = Spotify.PlaybackState & {
  track_window: Spotify.PlaybackState["track_window"] | null;
};

interface SpotifyPlayerContextType {
  player: Spotify.Player | null;
  playerState: PlaybackState | null;
  deviceId: string | null;
  setPlayer: (player: Spotify.Player | null) => void;
  setPlayerState: (state: PlaybackState | null) => void;
  setDeviceId: (id: string | null) => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | null>(
  null,
);

export const SpotifyPlayerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [playerState, setPlayerState] = useState<PlaybackState | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  return (
    <SpotifyPlayerContext.Provider
      value={{
        player,
        playerState,
        deviceId,
        setPlayer,
        setPlayerState,
        setDeviceId,
      }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  );
};

export const useSpotifyPlayerContext = () => {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error(
      "useSpotifyPlayerContext must be used within a SpotifyPlayerProvider",
    );
  }
  return context;
};
