export interface CuePointSelectorProps {
  spotifyUri: string;
  startMs: number;
  endMs: number;
  accessToken: string | null;
}

export interface PlayerState {
  isPlayingCorrectTrack: boolean;
  isPlayerReady: boolean;
  deviceId: string | null;
  currentTrack: Spotify.Track | null;
  isPaused: boolean;
  duration: number;
  start: number;
  end: number;
}

export interface PlayerControls {
  handlePlayPause: () => void;
  handlePreviousTrack: () => void;
  handleNextTrack: () => void;
  handleSliderChange: (values: [number, number]) => void;
  formatTime: (ms: number) => string;
}
