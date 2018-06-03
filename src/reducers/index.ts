import appShellReducer from './app-shell';
import metadataReducer from './metadata';
import partyReducer from './party';
import playerReducer from './player';
import userReducer from './user';
import homeReducer from './view-home';
import partyViewReducer from './view-party';
import settingsReducer from './view-settings';

export default {
    appShell: appShellReducer,
    homeView: homeReducer,
    metadata: metadataReducer,
    party: partyReducer,
    partyView: partyViewReducer,
    player: playerReducer,
    settingsView: settingsReducer,
    user: userReducer,
};
