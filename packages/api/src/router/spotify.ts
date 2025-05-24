import type { TRPCRouterRecord } from "@trpc/server";
import { SimplifiedPlaylist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import authClient from "@cued/auth/client";
import { env } from "@cued/auth/env";
import { and, eq } from "@cued/db";
import { account, track } from "@cued/db/schema";

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

    let accessToken = spotifyAcccount.accessToken;

    if (
      spotifyAcccount.accessTokenExpiresAt &&
      spotifyAcccount.accessTokenExpiresAt.getTime() < Date.now()
    ) {
      await authClient.refreshToken({
        providerId: "spotify",
        accountId: spotifyAcccount.id,
      });
    }
    const spotify = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, {
      access_token: accessToken,
      refresh_token: spotifyAcccount.refreshToken,
      token_type: "Bearer",
      expires: spotifyAcccount.accessTokenExpiresAt!.getTime(),
      expires_in: null!,
      // expires_in: spotifyAcccount.accessTokenExpiresAt!.getTime() - Date.now(),
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
  insertTrack: protectedProcedure
    .input(
      z.object({
        trackId: z.string(),
        preferredStart: z.number(),
        preferredEnd: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the track already exists
      const existingTrack = await ctx.db.query.track.findFirst({
        where: and(
          eq(track.trackId, input.trackId),
          eq(track.userId, ctx.session.user.id),
        ),
      });
      if (existingTrack) {
        // Update the track
        const result = await ctx.db
          .update(track)
          .set({
            preferredStart: input.preferredStart,
            preferredEnd: input.preferredEnd,
          })
          .where(
            and(
              eq(track.userId, existingTrack.userId),
              eq(track.trackId, existingTrack.trackId),
            ),
          );
      } else {
        // Insert the track
        const result = await ctx.db.insert(track).values({
          ...input,
          userId: ctx.session.user.id,
        });
      }

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
