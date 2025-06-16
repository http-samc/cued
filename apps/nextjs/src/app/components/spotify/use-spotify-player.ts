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

    // Check for browser compatibility
    if (!window.MediaKeys) {
      console.error("MediaKeys not supported in this browser");
      return;
    }

    const handleSpotifySDKReady = async () => {
      console.log("Spotify SDK ready — Creating player");

      try {
        if (!window.Spotify) {
          console.error("Spotify SDK not available");
          return;
        }

        const newPlayer = new window.Spotify.Player({
          name: "Cued",
          getOAuthToken: (cb) => {
            console.log("Getting OAuth token");
            cb(accessToken);
          },
          volume: 0.5,
          enableMediaSession: true,
        });

        // Create a promise that resolves when the player is ready
        const readyPromise = new Promise<void>((resolve) => {
          const readyListener = ({ device_id }: { device_id: string }) => {
            console.log("Player ready — Setting device ID", device_id);
            setDeviceId(device_id);
            setIsPlayerReady(true);
            resolve();
          };

          const notReadyListener = ({ device_id }: { device_id: string }) => {
            console.error("Player not ready", device_id);
          };

          const initializationErrorListener = (err: Spotify.Error) => {
            console.error("Player initialization error:", err);
          };

          const stateChangeListener = (state: Spotify.PlaybackState) => {
            console.log("Player state changed:", state);
            setPlayerState(state);
          };

          newPlayer.addListener("ready", readyListener);
          newPlayer.addListener("not_ready", notReadyListener);
          newPlayer.addListener(
            "initialization_error",
            initializationErrorListener,
          );
          newPlayer.addListener("player_state_changed", stateChangeListener);

          cleanupRef.current = () => {
            newPlayer.removeListener("ready", readyListener);
            newPlayer.removeListener("not_ready", notReadyListener);
            newPlayer.removeListener(
              "initialization_error",
              initializationErrorListener,
            );
            newPlayer.removeListener(
              "player_state_changed",
              stateChangeListener,
            );
          };
        });

        console.log("Connecting player");
        const connected = await newPlayer.connect();
        console.log("Player connection result:", connected);

        if (connected) {
          setPlayer(newPlayer);
          // Wait for the player to be ready
          await readyPromise;
          console.log("Player is fully ready");
        } else {
          console.error("Failed to connect player");
        }
      } catch (error) {
        console.error("Error creating player:", error);
      }
    };

    // Check if SDK is already loaded
    if (window.Spotify) {
      console.log("Spotify SDK already loaded");
      void handleSpotifySDKReady();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    script.onerror = (error) => {
      console.error("Failed to load Spotify SDK:", error);
    };

    script.onload = () => {
      console.log("Spotify SDK script loaded");
    };

    document.body.appendChild(script);

    // eslint-disable-next-line react-hooks/react-compiler
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("SDK Ready callback triggered");
      void handleSpotifySDKReady();
    };
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
