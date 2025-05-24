"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface SpotifyPlayerContextType {
  player: Spotify.Player | null;
  playerState: Spotify.PlaybackState | null;
  deviceId: string | null;
  setPlayer: (player: Spotify.Player | null) => void;
  setPlayerState: (state: Spotify.PlaybackState | null) => void;
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
  const [playerState, setPlayerState] = useState<Spotify.PlaybackState | null>(
    null,
  );
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
