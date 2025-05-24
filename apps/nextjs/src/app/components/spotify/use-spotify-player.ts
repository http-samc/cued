import { useCallback, useEffect } from "react";

import { useSpotifyPlayerContext } from "./spotify-player-context";

export const useSpotifyPlayer = (accessToken: string | null) => {
  const {
    player,
    playerState,
    deviceId,
    setPlayer,
    setPlayerState,
    setDeviceId,
  } = useSpotifyPlayerContext();

  const initializePlayer = useCallback(() => {
    if (!accessToken || player) return;
    console.log("Initializing player");

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = async () => {
      console.log("Spotify SDK ready");
      if (player) return;

      console.log("No player found, creating new player");

      const newPlayer = new window.Spotify.Player({
        name: "Cued",
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      newPlayer.on("ready", ({ device_id }) => {
        setDeviceId(device_id);
      });

      newPlayer.on("player_state_changed", (state) => {
        setPlayerState(state);
      });

      console.log("Connecting player");
      await newPlayer.connect();
      setPlayer(newPlayer);
    };
  }, [accessToken, player, setPlayer, setPlayerState, setDeviceId]);

  useEffect(() => {
    initializePlayer();
  }, [initializePlayer]);

  return { player, deviceId, playerState };
};
