import { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';

import {
    queueDragDrop,
    queueDragEnter,
    queueDragOver,
    QUEUE_DRAG_DROP,
    QUEUE_DRAG_ENTER,
    QUEUE_DRAG_OVER,
} from '../actions';
import { setVoteAction } from '../actions/queue';

export default function*() {
    yield takeEvery(QUEUE_DRAG_OVER, (event: ReturnType<typeof queueDragOver>) => {
        event.payload.event.preventDefault();
    });

    yield takeEvery(QUEUE_DRAG_ENTER, (event: ReturnType<typeof queueDragEnter>) => {
        event.payload.event.returnValue = false;
        event.payload.event.dataTransfer!.dropEffect = 'copy';
        event.payload.event.preventDefault();
    });

    yield takeEvery(QUEUE_DRAG_DROP, function*(event: ReturnType<typeof queueDragDrop>) {
        event.payload.event.preventDefault();
        const data: string = event.payload.event.dataTransfer!.getData('text/plain');
        const trackRegex = /\/track\/([0-9a-z]+)/gi;

        let match = trackRegex.exec(data);

        while (match !== null) {
            yield put(
                setVoteAction(
                    {
                        id: match[1],
                        provider: 'spotify',
                    },
                    true,
                ),
            );

            // Delay the track insertion to protect track order
            yield delay(100);

            match = trackRegex.exec(data);
        }
    });
}
