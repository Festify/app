import { Spotify } from 'spotify-web-playback-sdk';

declare global {
  interface Window {
    Spotify: typeof Spotify;
  }
}
