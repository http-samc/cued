/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useCallback, useEffect, useRef, useState } from "react";

import { useSpotifyPlayerContext } from "./spotify-player-context";

interface EnhancedPlayerState {
  isPlayerReady: boolean;
  isPaused: boolean;
  duration: number;
  position: number;
  isPlayingCorrectTrack: boolean;
  trackUri: string | null;
}

export const useSpotifyPlayer = (accessToken: string | null) => {
  const {
    player,
    playerState,
    deviceId,
    setPlayer,
    setPlayerState,
    setDeviceId,
  } = useSpotifyPlayerContext();

  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);

  const initializePlayer = useCallback(() => {
    if (!accessToken || player) return;
    console.log("Initializing player");

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    const handleSpotifySDKReady = async () => {
      console.log("Spotify SDK ready — Creating player");

      const newPlayer = new window.Spotify.Player({
        name: "Cued",
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      const readyListener = ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setIsPlayerReady(true);
      };

      const stateChangeListener = (state: Spotify.PlaybackState) => {
        setPlayerState(state);
      };

      newPlayer.addListener("ready", readyListener);
      newPlayer.addListener("player_state_changed", stateChangeListener);

      console.log("Connecting player");
      await newPlayer.connect();
      setPlayer(newPlayer);

      cleanupRef.current = () => {
        newPlayer.removeListener("ready", readyListener);
        newPlayer.removeListener("player_state_changed", stateChangeListener);
      };
    };

    // eslint-disable-next-line react-hooks/react-compiler
    window.onSpotifyWebPlaybackSDKReady = () => void handleSpotifySDKReady();
  }, [accessToken, player, setPlayer, setPlayerState, setDeviceId]);

  useEffect(() => {
    initializePlayer();
    return () => {
      cleanupRef.current?.();
    };
  }, [initializePlayer]);

  const enhancedState: EnhancedPlayerState = {
    isPlayerReady,
    isPaused: playerState?.paused ?? true,
    duration: playerState?.duration ?? 0,
    position: playerState?.position ?? 0,
    isPlayingCorrectTrack:
      playerState?.track_window?.current_track?.uri ===
      playerState?.track_window?.current_track?.uri,
    trackUri: playerState?.track_window?.current_track?.uri ?? null,
  };

  return { player, deviceId, playerState: enhancedState };
};
