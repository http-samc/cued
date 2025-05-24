import { useCallback, useEffect, useState } from "react";

export const useSpotifyPlayer = (accessToken: string | null) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const initializePlayer = useCallback(() => {
    console.log("Initializing player");
    if (!accessToken) return;
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

      console.log("Connecting player");
      await newPlayer.connect();
      setPlayer(newPlayer);
    };
  }, [accessToken]);

  useEffect(() => {
    initializePlayer();
  }, [accessToken]);

  return { player, deviceId };
};
