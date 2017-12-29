import metadataReducer from './metadata';
import partyReducer from './party';
import userReducer from './user';
import homeReducer from './view-home';
import partyViewReducer from './view-party';
import settingsReducer from './view-settings';

export default {
    homeView: homeReducer,
    metadata: metadataReducer,
    party: partyReducer,
    partyView: partyViewReducer,
    settingsView: settingsReducer,
    user: userReducer,
};
