import authSaga from './auth';
import linkJoinCreateSaga from './link-join-create';
import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import toastSaga from './toast';
import viewHomeSaga from './view-home';
import viewQueueSaga from './view-party-queue';
import searchSaga from './view-party-search';
import viewSettingsSaga from './view-party-settings';
import viewShareSaga from './view-party-share';

export default [
    authSaga,
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
