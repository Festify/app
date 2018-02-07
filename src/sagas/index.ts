import { all } from 'redux-saga/effects';

import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import searchSaga from './search';
import toastSaga from './toast';

export default [
    metadataSaga,
    partyDataSaga,
    searchSaga,
    toastSaga,
];
