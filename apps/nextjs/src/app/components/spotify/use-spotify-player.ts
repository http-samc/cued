import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCurrentListeners,
  getGlobalPlayer,
  initializePlayer,
  setCurrentListeners,
  stopPlayback,
} from "./player-manager";
import { PlayerControls, PlayerState } from "./types";

export const useSpotifyPlayer = (
  spotifyUri: string,
  startMs: number,
  accessToken: string | null,
): [PlayerState, PlayerControls] => {
  const [state, setState] = useState<PlayerState>({
    isPlayingCorrectTrack: false,
    isPlayerReady: false,
    deviceId: null,
    currentTrack: null,
    isPaused: false,
    duration: 0,
    start: startMs,
    end: 0,
  });

  // Add refs to track previous values and prevent infinite loops
  const prevSpotifyUri = useRef(spotifyUri);
  const isForcePlaying = useRef(false);
  const lastForcePlayTime = useRef(0);

  const forcePlayTrack = useCallback(
    async (deviceId: string) => {
      if (
        !accessToken ||
        !deviceId ||
        state.isPlayingCorrectTrack ||
        !spotifyUri
      )
        return;

      // Prevent rapid consecutive force play attempts
      const now = Date.now();
      if (now - lastForcePlayTime.current < 2000) return; // 2 second cooldown
      lastForcePlayTime.current = now;

      // Prevent concurrent force play attempts
      if (isForcePlaying.current) return;
      isForcePlaying.current = true;

      console.log("Force playing track:", spotifyUri);
      try {
        // First, ensure we're the active device
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false,
          }),
        });

        // Then immediately start playing our track
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              uris: [spotifyUri],
              position_ms: state.start,
            }),
          },
        );
        setState((prev) => ({ ...prev, isPlayingCorrectTrack: true }));
      } catch (error) {
        console.error("Error force playing track:", error);
        setState((prev) => ({ ...prev, isPlayingCorrectTrack: false }));
      } finally {
        isForcePlaying.current = false;
      }
    },
    [spotifyUri, accessToken, state.start, state.isPlayingCorrectTrack],
  );

  const setupPlayer = useCallback(async () => {
    if (!accessToken) return;

    try {
      await initializePlayer(accessToken);
      const player = getGlobalPlayer();

      if (!player) return;

      // Remove any existing listeners
      Object.values(getCurrentListeners())
        .flat()
        .forEach((removeListener) => removeListener());
      setCurrentListeners({});

      // Add listeners
      const readyListener = (data: { device_id: string }) => {
        if (!data?.device_id) {
          console.log("Ready listener: Invalid data", { data });
          return;
        }
        console.log("Ready with Device ID", data.device_id);
        setState((prev) => ({
          ...prev,
          deviceId: data.device_id,
          isPlayerReady: true,
          isPlayingCorrectTrack: false,
        }));

        // Force play the track as soon as we have a device ID
        forcePlayTrack(data.device_id);
      };

      const notReadyListener = (data: { device_id: string }) => {
        if (!data?.device_id) return;
        console.log("Device ID has gone offline", data.device_id);
        setState((prev) => ({
          ...prev,
          isPlayerReady: false,
          isPlayingCorrectTrack: false,
        }));
      };

      const stateChangeListener = (
        playbackState: Spotify.PlaybackState | null,
      ) => {
        if (!playbackState) {
          console.log("State change: Invalid state", { playbackState });
          return;
        }

        const currentTrack = playbackState.track_window.current_track;
        const isCorrectTrack = currentTrack.uri === spotifyUri;

        // Only update state if something actually changed
        setState((prev) => {
          if (
            prev.currentTrack?.uri === currentTrack.uri &&
            prev.isPaused === playbackState.paused &&
            prev.duration === playbackState.duration &&
            prev.isPlayingCorrectTrack === isCorrectTrack
          ) {
            return prev;
          }

          return {
            ...prev,
            currentTrack,
            isPaused: playbackState.paused,
            duration: playbackState.duration,
            isPlayingCorrectTrack: isCorrectTrack,
          };
        });

        // Only force play if we're playing a different track and it's not already being handled
        if (!isCorrectTrack && !isForcePlaying.current) {
          if (state.deviceId) {
            forcePlayTrack(state.deviceId);
          }
        }
      };

      const errorListener = (error: any) => {
        console.error("Player error:", error);
        setState((prev) => ({
          ...prev,
          isPlayerReady: false,
          isPlayingCorrectTrack: false,
        }));
      };

      player.addListener("ready", readyListener);
      player.addListener("not_ready", notReadyListener);
      player.addListener("player_state_changed", stateChangeListener);
      player.addListener("initialization_error", errorListener);
      player.addListener("authentication_error", errorListener);
      player.addListener("account_error", errorListener);
      player.addListener("playback_error", errorListener);

      // Store listeners for cleanup
      const playerListeners = {
        ready: [readyListener],
        not_ready: [notReadyListener],
        player_state_changed: [stateChangeListener],
        initialization_error: [errorListener],
        authentication_error: [errorListener],
        account_error: [errorListener],
        playback_error: [errorListener],
      };
      setCurrentListeners(playerListeners);
    } catch (error) {
      console.error("Failed to initialize player:", error);
      setState((prev) => ({
        ...prev,
        isPlayerReady: false,
        isPlayingCorrectTrack: false,
      }));
    }
  }, [forcePlayTrack]);

  // Effect to handle player setup and cleanup
  useEffect(() => {
    if (!accessToken) return;

    // Only reinitialize if the URI actually changed
    if (prevSpotifyUri.current !== spotifyUri) {
      prevSpotifyUri.current = spotifyUri;
      setupPlayer();
    }

    return () => {
      setState((prev) => ({
        ...prev,
        isPlayerReady: false,
        isPlayingCorrectTrack: false,
      }));
      // Remove only this component's listeners
      Object.values(getCurrentListeners())
        .flat()
        .forEach((removeListener) => removeListener());
      // Stop playback when component unmounts
      if (accessToken) {
        stopPlayback(accessToken);
      }
    };
  }, [accessToken, setupPlayer, spotifyUri]);

  // Effect to handle track changes
  useEffect(() => {
    if (state.deviceId && state.isPlayerReady && !state.isPlayingCorrectTrack) {
      forcePlayTrack(state.deviceId);
    }
  }, [
    forcePlayTrack,
    spotifyUri,
    state.deviceId,
    state.isPlayerReady,
    state.isPlayingCorrectTrack,
  ]);

  const handleSliderChange = useCallback(
    ([newStart, newEnd]: [number, number]) => {
      // Calculate which thumb was moved by comparing with previous values
      const startDiff = Math.abs(newStart - state.start);
      const endDiff = Math.abs(newEnd - state.end);
      const movedStart = startDiff > endDiff;

      if (movedStart) {
        // If start thumb was moved, ensure it doesn't go beyond end
        newStart = Math.min(newStart, state.end);
        setState((prev) => ({ ...prev, start: newStart }));
        const player = getGlobalPlayer();
        if (player) {
          player.seek(newStart);
        }
      } else {
        // If end thumb was moved, ensure it doesn't go before start
        newEnd = Math.max(newEnd, state.start);
        setState((prev) => ({ ...prev, end: newEnd }));
      }
    },
    [state.start, state.end],
  );

  const handlePlayPause = useCallback(() => {
    const player = getGlobalPlayer();
    if (!player) return;
    player.togglePlay();
  }, []);

  const handlePreviousTrack = useCallback(() => {
    const player = getGlobalPlayer();
    if (!player) return;
    player.previousTrack();
  }, []);

  const handleNextTrack = useCallback(() => {
    const player = getGlobalPlayer();
    if (!player) return;
    player.nextTrack();
  }, []);

  const formatTime = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const controls: PlayerControls = {
    handlePlayPause,
    handlePreviousTrack,
    handleNextTrack,
    handleSliderChange,
    formatTime,
  };

  return [state, controls];
};
