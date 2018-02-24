import authSaga from './auth';
import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import playbackSaga from './playback-spotify';
import searchSaga from './search';
import shareSaga from './share';
import toastSaga from './toast';

import viewHomeSaga from './view-home';

export default [
    authSaga,
    metadataSaga,
    partyDataSaga,
    playbackSaga,
    searchSaga,
    shareSaga,
    toastSaga,

    viewHomeSaga,
];
