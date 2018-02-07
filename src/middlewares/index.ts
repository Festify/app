import fetchMetadata from './fetch-metadata';
import fetchPlaylists from './fetch-playlists';
import fetchSearch from './fetch-search';
import handleOAuth from './handle-oauth';
import handlePlaybackTrackChange from './handle-playback-track-change';

export default [
    fetchMetadata as any,
    fetchPlaylists as any,
    fetchSearch as any,
    handleOAuth as any,
    handlePlaybackTrackChange as any,
];
