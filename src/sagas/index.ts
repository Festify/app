import authSaga from './auth';
import linkJoinCreateSaga from './link-join-create';
import { checkPlaybackSdkCompatibility as compatibilitySaga } from './local-player';
import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import searchSaga from './search';
import shareSaga from './share';
import toastSaga from './toast';

import viewHomeSaga from './view-home';
import viewTvSaga from './view-tv';

export default [
    authSaga,
    compatibilitySaga,
    linkJoinCreateSaga,
    metadataSaga,
    partyDataSaga,
    searchSaga,
    shareSaga,
    toastSaga,

    viewHomeSaga,
    viewTvSaga,
];
