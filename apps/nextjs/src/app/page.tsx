"use client";

import React from "react";

import client from "@cued/auth/client";

import { SpotifyLoginButton } from "./components/SpotifyLoginButton";

const Home = () => {
  const { data } = client.useSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {data?.user ? (
        <div>
          <p>Welcome {data.user.email}.</p>
          <button onClick={() => client.signOut()}>Sign out</button>
        </div>
      ) : (
        <SpotifyLoginButton />
      )}
    </main>
  );
};

export default Home;
