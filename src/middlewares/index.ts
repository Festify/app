import fetchPlaylists from './fetch-playlists';
import handleOAuth from './handle-oauth';
import handlePlaybackTrackChange from './handle-playback-track-change';

export default [
    fetchPlaylists as any,
    handleOAuth as any,
    handlePlaybackTrackChange as any,
];
