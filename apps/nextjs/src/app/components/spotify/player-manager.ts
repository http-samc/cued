// Global player manager
let globalPlayer: Spotify.Player | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;
let currentListeners: { [key: string]: ((...args: any[]) => void)[] } = {};

export const initializePlayer = (accessToken: string): Promise<void> => {
  if (globalPlayer) {
    console.log("Disconnecting existing player instance");
    globalPlayer.disconnect();
    globalPlayer = null;
  }

  if (isInitializing) {
    console.log("Player initialization already in progress");
    return initializationPromise!;
  }

  console.log("Starting new player initialization");
  isInitializing = true;
  initializationPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("Spotify SDK ready, creating player");
      globalPlayer = new window.Spotify.Player({
        name: "Cued",
        getOAuthToken: (cb) => {
          console.log("Getting OAuth token");
          cb(accessToken);
        },
        volume: 0.5,
      });

      console.log("Connecting player");
      globalPlayer.connect();
      isInitializing = false;
      resolve();
    };
  });

  return initializationPromise;
};

export const stopPlayback = async (accessToken: string) => {
  try {
    await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error("Failed to stop playback:", error);
  }
};

export const getGlobalPlayer = () => globalPlayer;

export const getCurrentListeners = () => currentListeners;

export const setCurrentListeners = (listeners: {
  [key: string]: ((...args: any[]) => void)[];
}) => {
  currentListeners = listeners;
};
