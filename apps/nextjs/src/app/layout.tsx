import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@cued/ui";
import { ThemeProvider } from "@cued/ui/theme";
import { Toaster } from "@cued/ui/toast";

import { TRPCReactProvider } from "~/trpc/react";
import { SpotifyPlayerProvider } from "./components/spotify/spotify-player-context";

import "~/app/globals.css";

import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://cued.smrth.dev"
      : "http://127.0.0.1:3000",
  ),
  title: "Cued",
  description: "Play the best parts of your favorite songs.",
  openGraph: {
    title: "Cued",
    description: "Play the best parts of your favorite songs.",
    url: "https://cued.smrth.dev",
    siteName: "Cued",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Cued logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@http_samc",
    creator: "@http_samc",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Cued logo",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TRPCReactProvider>
            <SpotifyPlayerProvider>{props.children}</SpotifyPlayerProvider>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
