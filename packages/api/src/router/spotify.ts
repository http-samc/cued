import type { TRPCRouterRecord } from "@trpc/server";
import { SimplifiedPlaylist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@cued/auth/env";
import { eq } from "@cued/db";
import { account } from "@cued/db/schema";

import { spotify } from "../lib/spotify";
import { protectedProcedure } from "../trpc";

export const spotifyRouter = {
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const results = await spotify.search(input.query, [
        "track",
        // "playlist",
        // "album",
      ]);
      return {
        // playlists: results.playlists.items,
        tracks: results.tracks.items,
        // albums: results.albums.items,
      };
    }),
  getCurrentUsersPlaylists: protectedProcedure.query(async ({ ctx }) => {
    const spotifyAcccount = await ctx.db.query.account.findFirst({
      where: eq(account.userId, ctx.session.user.id),
    });

    if (!spotifyAcccount?.accessToken || !spotifyAcccount.refreshToken) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No Spotify account found",
      });
    }

    const spotify = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, {
      access_token: spotifyAcccount.accessToken,
      refresh_token: spotifyAcccount.refreshToken,
      token_type: "Bearer",
      expires_in: spotifyAcccount.accessTokenExpiresAt!.getTime() - Date.now(),
    });

    const playlists: SimplifiedPlaylist[] = [];
    let i = 0;
    while (true) {
      const result = await spotify.currentUser.playlists.playlists(50, i * 50);
      playlists.push(...result.items);
      if (!result.next) {
        break;
      }
      i++;
    }

    return playlists;
  }),
} satisfies TRPCRouterRecord;
