import fetchMetadata from './fetch-metadata';
import fetchParty from './fetch-party';
import fetchSearch from './fetch-search';
import handleOAuth from './handle-oauth';

export default [
    fetchMetadata as any,
    fetchParty,
    fetchSearch as any,
    handleOAuth as any,
];
