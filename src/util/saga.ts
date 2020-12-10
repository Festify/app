import { Pattern } from 'redux-saga';
import { fork, select, take, ForkEffect } from 'redux-saga/effects';

// If only we had variadics...

export function takeEveryWithState<S, T>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (action: any, oldState: T, newState: T) => any,
): ForkEffect;
export function takeEveryWithState<S, T, A1>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (action: any, oldState: T, newState: T, arg1: A1) => any,
    arg1: A1,
): ForkEffect;
export function takeEveryWithState<S, T, A1, A2>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (action: any, oldState: T, newState: T, arg1: A1, arg2: A2) => any,
    arg1: A1,
    arg2: A2,
): ForkEffect;
export function takeEveryWithState<S, T, A1, A2, A3>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (action: any, oldState: T, newState: T, arg1: A1, arg2: A2, arg3: A3) => any,
    arg1: A1,
    arg2: A2,
    arg3: A3,
): ForkEffect;
export function takeEveryWithState<S, T, A1, A2, A3>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (action: any, oldState: T, newState: T, arg1: A1, arg2: A2, arg3: A3, ...rest) => any,
    arg1: A1,
    arg2: A2,
    arg3: A3,
    ...rest
): ForkEffect;
export function takeEveryWithState<S, T, A1, A2, A3, A4>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (
        action: any,
        oldState: T,
        newState: T,
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        ...rest
    ) => any,
    arg1: A1,
    arg2: A2,
    arg3: A3,
    arg4: A4,
    ...rest
): ForkEffect;
export function takeEveryWithState<S, T>(
    pattern: Pattern,
    selector: (state: S) => T,
    saga: (action: any, oldState: T, ...rest) => any,
    ...args
): ForkEffect {
    return fork(function*() {
        while (true) {
            const oldState: T = yield select(selector);
            const action = yield take(pattern as any);
            const newState: T = yield select(selector);
            yield (fork as any)(saga, action, oldState, newState, ...args);
        }
    });
}
