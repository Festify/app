import partyReducer from "./party";
import tracksReducer from './tracks';
import homeReducer from './view-home';

export default {
    homeView: homeReducer,
    tracks: tracksReducer,
    party: partyReducer,
};
