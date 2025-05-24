export const playTrack = async (
  accessToken: string | null,
  deviceId: string | null,
  spotifyUri: string,
  startMs: number = 0,
) => {
  if (!accessToken || !deviceId || !spotifyUri) return;
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
