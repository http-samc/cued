export const playTrack = async (
  accessToken: string | null,
  deviceId: string | null,
  spotifyUri: string,
  startMs = 0,
  player: Spotify.Player | null,
) => {
  if (!accessToken || !deviceId || !spotifyUri || !player) {
    console.error("Missing required parameters");
    return;
  }

  // First, use the REST API to set the track
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
        position_ms: startMs,
      }),
    },
  );

  await player.resume();
};

export const pauseTrack = async (
  accessToken: string | null,
  deviceId: string | null,
) => {
  if (!accessToken || !deviceId) return;
  await fetch(
    `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
};
