"use client";

import React from "react";
import Link from "next/link";

import { SpotifyLoginButton } from "./components/SpotifyLoginButton";

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col gap-6 border border-dashed p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-4xl font-bold">
            Welcome to <span className="text-primary">Cued</span>
          </h1>
          <h3 className="text-xl text-muted-foreground opacity-80">
            Play the best parts of your favorite songs.
          </h3>
        </div>
        <SpotifyLoginButton />
      </div>
      <p className="pt-8 text-xs">
        engineering by{" "}
        <Link
          href="https://smrth.dev"
          target="_blank"
          className="font-mono text-blue-500 underline"
        >
          smrth
        </Link>
      </p>
    </main>
  );
};

export default Home;
