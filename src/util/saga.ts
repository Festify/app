import { Pattern } from 'redux-saga';
import { fork, select, take } from 'redux-saga/effects';

export function takeEveryWithState<S, T>(
    pattern: Pattern, selector: (state: S) => T,
    saga: (action: any, oldState: T, newState: T, ...rest) => any,
    ...args,
) {
    return fork(function* () {
        while (true) {
            const oldState: T = yield select(selector);
            const action = yield take(pattern as any);
            const newState: T = yield select(selector);
            yield (fork as any)(saga, ...[action, oldState, newState].concat(args));
        }
    });
}
