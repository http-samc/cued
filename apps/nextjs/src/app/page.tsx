import React from "react";

import { SpotifyLoginButton } from "./components/SpotifyLoginButton";

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <SpotifyLoginButton />
    </main>
  );
};

export default Home;
