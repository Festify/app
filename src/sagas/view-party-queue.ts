import { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';

import { QueueDragEnterAction, Types } from '../actions';
import { setVoteAction } from '../actions/queue';

export default function*() {
    yield takeEvery(Types.QUEUE_DRAG_Over, (event: QueueDragEnterAction) => {
        event.payload.event.preventDefault();
    });

    yield takeEvery(Types.QUEUE_DRAG_Enter, (event: QueueDragEnterAction) => {
        event.payload.event.returnValue = false;
        event.payload.event.dataTransfer.dropEffect = "copy";
        event.payload.event.preventDefault();
    });

    yield takeEvery(Types.QUEUE_DRAG_Drop, function*(event: QueueDragEnterAction) {
        event.payload.event.preventDefault();
        const data: string = event.payload.event.dataTransfer.getData("text/plain");
        const trackRegex = /\/track\/([0-9a-z]+)/gi;

        let match = trackRegex.exec(data);

        while (match !== null) {
            yield put(setVoteAction({
                id: match[1],
                provider: 'spotify',
            }, true));

            // Delay the track insertion to protect track order
            yield delay(100);

            match = trackRegex.exec(data);
        }
    });
}
