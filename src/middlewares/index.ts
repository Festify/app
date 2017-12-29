import fetchMetadata from './fetch-metadata';
import fetchParty from './fetch-party';
import fetchPlaylists from './fetch-playlists';
import fetchSearch from './fetch-search';
import handleOAuth from './handle-oauth';

export default [
    fetchMetadata as any,
    fetchParty,
    fetchPlaylists as any,
    fetchSearch as any,
    handleOAuth as any,
];
