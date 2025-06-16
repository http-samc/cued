export const playTrack = async (
  accessToken: string | null,
  deviceId: string | null,
  spotifyUri: string,
  startMs = 0,
) => {
  if (!accessToken || !spotifyUri) return;
  await fetch(
    `https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ""}`,
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
  if (!accessToken) return;
  await fetch(
    `https://api.spotify.com/v1/me/player/pause${deviceId ? `?device_id=${deviceId}` : ""}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
};
