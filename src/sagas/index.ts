import { all } from 'redux-saga/effects';

import partyDataSaga from './party-data';
import toastSaga from './toast';

export default [
    partyDataSaga,
    toastSaga,
];
