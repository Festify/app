import metadataReducer from './metadata';
import partyReducer from './party';
import tracksReducer from './tracks';
import homeReducer from './view-home';

export default {
    homeView: homeReducer,
    metadata: metadataReducer,
    tracks: tracksReducer,
    party: partyReducer,
};
