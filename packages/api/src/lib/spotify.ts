import { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { env } from "@cued/auth/env";

export const spotify = SpotifyApi.withClientCredentials(
  env.SPOTIFY_CLIENT_ID,
  env.SPOTIFY_CLIENT_SECRET,
);
