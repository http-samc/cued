/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AccessToken, TrackItem } from "@spotify/web-api-ts-sdk";
import { and, eq } from "drizzle-orm";

import { env } from "@cued/auth/env";
import { db } from "@cued/db/client";
import { account, track } from "@cued/db/schema";

export const getResolvedTrackData = async (
  userId: string,
  { id, duration_ms }: TrackItem,
) => {
  const internalTrackData = await db.query.track.findFirst({
    where: and(
      eq(track.trackId, `spotify:track:${id}`),
      eq(track.userId, userId),
    ),
  });

  return {
    preferredStart: internalTrackData?.preferredStart ?? 0,
    preferredEnd: internalTrackData?.preferredEnd ?? duration_ms,
  };
};

export const refreshAccessToken = async (
  clientId: string,
  refreshToken: string,
  accountId: string,
) => {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const text = await result.text();

  if (!result.ok) {
    throw new Error(`Failed to refresh token: ${result.statusText}, ${text}`);
  }

  const refreshedAccessToken = JSON.parse(text) as AccessToken;

  // Update the database with the new access token and expiry
  await db
    .update(account)
    .set({
      accessToken: refreshedAccessToken.access_token,
      accessTokenExpiresAt: new Date(
        Date.now() + refreshedAccessToken.expires_in * 1000,
      ),
    })
    .where(eq(account.id, accountId));

  return refreshedAccessToken;
};

export const getAccessToken = async (userId: string): Promise<AccessToken> => {
  const spotifyAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "spotify")),
  });

  if (!spotifyAccount?.accessToken || !spotifyAccount.refreshToken) {
    throw new Error("No Spotify account found for user");
  }

  let accessToken = spotifyAccount.accessToken;

  if (spotifyAccount.accessTokenExpiresAt!.getTime() < Date.now()) {
    const refreshedAccessToken = await refreshAccessToken(
      env.SPOTIFY_CLIENT_ID,
      spotifyAccount.refreshToken,
      spotifyAccount.id,
    );

    accessToken = refreshedAccessToken.access_token;
  }

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: spotifyAccount.accessTokenExpiresAt!.getTime() - Date.now(),
    refresh_token: spotifyAccount.refreshToken,
  };
};
