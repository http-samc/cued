import type {
  PlaylistedTrack,
  SimplifiedPlaylist,
  Track,
} from "@spotify/web-api-ts-sdk";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, inArray } from "@cued/db";
import { db } from "@cued/db/client";
import { track } from "@cued/db/schema";

import { spotify, spotifyWithAccessToken } from "../lib/spotify";
import { protectedProcedure } from "../trpc";

const hydrateTracks = async (tracks: Track[], userId: string) => {
  const userTracks = await db.query.track.findMany({
    where: and(
      eq(track.userId, userId),
      inArray(
        track.trackId,
        tracks.map((t) => `spotify:track:${t.id}`),
      ),
    ),
  });

  // console.log(
  //   userId,
  //   tracks.map((t) => `spotify:track:${t.id}`),
  //   userTracks.map((t) => t.trackId),
  // );

  return tracks.map((t) => {
    const userTrack = userTracks.find(
      (ut) => ut.trackId === `spotify:track:${t.id}`,
    );

    return {
      ...t,
      preferredStart: userTrack?.preferredStart,
      preferredEnd: userTrack?.preferredEnd,
    };
  });
};

export const spotifyRouter = {
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const results = await spotify.search(input.query, [
        "track",
        // "playlist",
        // "album",
      ]);

      return {
        // playlists: results.playlists.items,
        tracks: await hydrateTracks(results.tracks.items, ctx.session.user.id),
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

      return await hydrateTracks(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        tracks.map((t) => t.track).filter((t) => t !== null),
        ctx.session.user.id,
      );
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
