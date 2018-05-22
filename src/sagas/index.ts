import authSaga from './auth';
import linkSaga from './link';
import linkJoinCreateSaga from './link-join-create';
import { checkPlaybackSdkCompatibility as compatibilitySaga } from './local-player';
import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import toastSaga from './toast';
import searchSaga from './view-party-search';

import viewHomeSaga from './view-home';
import viewQueueSaga from './view-party-queue';
import viewSettingsSaga from './view-party-settings';
import viewShareSaga from './view-party-share';

export default [
    authSaga,
    compatibilitySaga,
    linkSaga,
    linkJoinCreateSaga,
    metadataSaga,
    partyDataSaga,
    searchSaga,
    toastSaga,

    viewHomeSaga,
    viewQueueSaga,
    viewSettingsSaga,
    viewShareSaga,
];
