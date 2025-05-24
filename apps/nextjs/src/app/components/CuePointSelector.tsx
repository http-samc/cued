"use client";

import React, { useEffect, useState } from "react";
import SpotifyPlayer from "react-spotify-web-playback";

import client from "@cued/auth/client";

interface CuePointSelectorProps {
  spotifyUri: string;
  startMs: number;
  endMs: number;
  accessToken: string | null;
}

const CuePointSelector = ({
  spotifyUri,
  startMs,
  endMs,
  accessToken,
}: CuePointSelectorProps) => {
  // Render a spotify player for the given uri with audio controls. There should be draggable handles to select the start and end of the audio.
  const [start, setStart] = useState(startMs);
  const [end, setEnd] = useState(endMs);

  return accessToken ? (
    <SpotifyPlayer
      token={accessToken}
      uris={[spotifyUri]}
      initialVolume={0.5}
    />
  ) : null;
};

export default CuePointSelector;
