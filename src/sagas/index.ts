import { all } from 'redux-saga/effects';

import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import toastSaga from './toast';

export default [
    metadataSaga,
    partyDataSaga,
    toastSaga,
];
