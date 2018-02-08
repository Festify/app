import { all } from 'redux-saga/effects';

import authSaga from './auth';
import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import searchSaga from './search';
import toastSaga from './toast';

import viewHomeSaga from './view-home';

export default [
    authSaga,
    metadataSaga,
    partyDataSaga,
    searchSaga,
    toastSaga,

    viewHomeSaga,
];
