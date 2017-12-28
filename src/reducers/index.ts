import metadataReducer from './metadata';
import partyReducer from './party';
import userReducer from './user';
import homeReducer from './view-home';
import partyViewReducer from './view-party';

export default {
    homeView: homeReducer,
    metadata: metadataReducer,
    party: partyReducer,
    partyView: partyViewReducer,
    user: userReducer,
};
