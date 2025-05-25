import type {
  PlaylistedTrack,
  SimplifiedPlaylist,
  Track,
} from "@spotify/web-api-ts-sdk";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq } from "@cued/db";
import { track } from "@cued/db/schema";

import { spotify, spotifyWithAccessToken } from "../lib/spotify";
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
    const spotify = await spotifyWithAccessToken(ctx.session.user.id);
    const spotifyUser = await spotify.currentUser.profile();

    const playlists: SimplifiedPlaylist[] = [];
    let i = 0;
    while (true) {
      const result = await spotify.playlists.getUsersPlaylists(
        spotifyUser.id,
        50,
        i * 50,
      );
      playlists.push(...result.items);
      if (!result.next) {
        break;
      }
      i++;
    }

    return playlists;
  }),
  getPlaylistTracks: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .query(async ({ ctx, input }) => {
      const spotify = await spotifyWithAccessToken(ctx.session.user.id);

      const tracks: PlaylistedTrack<Track>[] = [];
      let i = 0;
      while (true) {
        const result = await spotify.playlists.getPlaylistItems(
          input.playlistId,
          undefined,
          undefined,
          50,
          i * 50,
        );
        tracks.push(...result.items);
        if (!result.next) {
          break;
        }
        i++;
      }

      return tracks;
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
      let result: "created" | "updated";
      // Check if the track already exists
      const existingTrack = await ctx.db.query.track.findFirst({
        where: and(
          eq(track.trackId, input.trackId),
          eq(track.userId, ctx.session.user.id),
        ),
      });
      if (existingTrack) {
        result = "updated";
        // Update the track
        await ctx.db
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
        result = "created";
        await ctx.db.insert(track).values({
          ...input,
          userId: ctx.session.user.id,
        });
      }

      return { success: true, result };
    }),
} satisfies TRPCRouterRecord;
