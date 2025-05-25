import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { TRPCError } from "@trpc/server";

import authClient from "@cued/auth/client";
import { env } from "@cued/auth/env";
import { eq } from "@cued/db";
import { db } from "@cued/db/client";
import { account } from "@cued/db/schema";

export const spotify = SpotifyApi.withClientCredentials(
  env.SPOTIFY_CLIENT_ID,
  env.SPOTIFY_CLIENT_SECRET,
);

export const spotifyWithAccessToken = async (userId: string) => {
  const spotifyAcccount = await db.query.account.findFirst({
    where: eq(account.userId, userId),
  });

  if (!spotifyAcccount?.accessToken || !spotifyAcccount.refreshToken) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No Spotify account found",
    });
  }

  const accessToken = spotifyAcccount.accessToken;

  if (
    spotifyAcccount.accessTokenExpiresAt &&
    spotifyAcccount.accessTokenExpiresAt.getTime() < Date.now()
  ) {
    await authClient.refreshToken({
      providerId: "spotify",
      accountId: spotifyAcccount.id,
    });
  }

  return SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, {
    access_token: accessToken,
    refresh_token: spotifyAcccount.refreshToken,
    token_type: "Bearer",
    expires: spotifyAcccount.accessTokenExpiresAt?.getTime(),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expires_in: null!,
    // expires_in: spotifyAcccount.accessTokenExpiresAt!.getTime() - Date.now(),
  });
};
