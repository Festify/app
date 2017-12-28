import authReducer from './auth';
import metadataReducer from './metadata';
import partyReducer from './party';
import homeReducer from './view-home';
import partyViewReducer from './view-party';

export default {
    auth: authReducer,
    homeView: homeReducer,
    metadata: metadataReducer,
    party: partyReducer,
    partyView: partyViewReducer,
};
