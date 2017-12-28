import metadataReducer from './metadata';
import partyReducer from './party';
import tracksReducer from './tracks';
import homeReducer from './view-home';
import partyViewReducer from './view-party';

export default {
    homeView: homeReducer,
    metadata: metadataReducer,
    party: partyReducer,
    partyView: partyViewReducer,
    tracks: tracksReducer,
};
