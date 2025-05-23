import { AccessToken, TrackItem } from "@spotify/web-api-ts-sdk";
import { and, eq } from "drizzle-orm";

import { env } from "@cued/auth/env";
import { db } from "@cued/db/client";
import { account } from "@cued/db/schema";

export const getResolvedTrackData = async (track: TrackItem) => {
  return {
    preferredStart: 750,
    preferredEnd: track.duration_ms,
  };
};

const refreshAccessToken = async (clientId: string, refreshToken: string) => {
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

  const json: AccessToken = JSON.parse(text);
  return json;
};

export const getAccessToken = async (userId: string): Promise<AccessToken> => {
  const spotifyAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "spotify")),
  });

  if (!spotifyAccount?.accessToken || !spotifyAccount.refreshToken) {
    throw new Error("No Spotify account found for user");
  }

  // let accessToken = spotifyAccount.accessToken;

  // if (spotifyAccount.accessTokenExpiresAt!.getTime() < Date.now()) {
  //   console.log("Refreshing access token");
  //   const refreshedAccessToken = await refreshAccessToken(
  //     env.SPOTIFY_CLIENT_ID,
  //     spotifyAccount.refreshToken,
  //   );

  //   await db
  //     .update(account)
  //     .set({
  //       accessToken: refreshedAccessToken.access_token,
  //       accessTokenExpiresAt: new Date(
  //         Date.now() + refreshedAccessToken.expires_in * 1000,
  //       ),
  //     })
  //     .where(eq(account.id, spotifyAccount.id));

  //   accessToken = refreshedAccessToken.access_token;
  // }

  return {
    access_token: spotifyAccount.accessToken,
    token_type: "Bearer",
    expires_in: spotifyAccount.accessTokenExpiresAt!.getTime() - Date.now(),
    refresh_token: spotifyAccount.refreshToken,
  };
};
