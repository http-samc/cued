import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@cued/db/client";

import { env } from "../env";

interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  images?: Array<{ url: string }>;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    spotify: {
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
      // redirectUri: "http://127.0.0.1:3000/api/auth/callback/spotify",
      scope: [
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-read-playback-state",
        "user-library-read",
        "streaming",
        "user-read-email",
        "user-read-private",
      ],
    },
  },
});
