import { RouterActions } from '@festify/redux-little-router';

import { Actions as AuthActions } from './auth';
import { Actions as MetadataActions } from './metadata';
import { Actions as PartyDataActions } from './party-data';
import { Actions as PlaybackSpotifyActions } from './playback-spotify';
import { Actions as QueueActions } from './queue';
import { Actions as HomeViewActions } from './view-home';
import { Actions as PartyViewActions } from './view-party';
import { Actions as SettingsActions } from './view-party-settings';
import { Actions as ShareActions } from './view-party-share';
import { Actions as QueueDrawerActions } from './view-queue-drawer';

export type Actions =
    | AuthActions
    | CommonActions
    | HomeViewActions
    | MetadataActions
    | PartyDataActions
    | PartyViewActions
    | PlaybackSpotifyActions
    | RouterActions
    | QueueActions
    | QueueDrawerActions
    | SettingsActions
    | ShareActions;

export type CommonActions =
    | ReturnType<typeof generateInstanceId>
    | ReturnType<typeof hideToast>
    | ReturnType<typeof queueDragDrop>
    | ReturnType<typeof queueDragEnter>
    | ReturnType<typeof queueDragOver>
    | ReturnType<typeof showToast>;

export const ASSIGN_INSTANCE_ID = 'ASSIGN_INSTANCE_ID';
export const HIDE_TOAST = 'HIDE_TOAST';
export const QUEUE_DRAG_ENTER = 'QUEUE_DRAG_ENTER';
export const QUEUE_DRAG_OVER = 'QUEUE_DRAG_OVER';
export const QUEUE_DRAG_DROP = 'QUEUE_DRAG_DROP';
export const SHOW_TOAST = 'SHOW_TOAST';

export const queueDragEnter = (event: DragEvent) => ({
    type: QUEUE_DRAG_ENTER as typeof QUEUE_DRAG_ENTER,
    payload: { event },
});

export const queueDragOver = (event: DragEvent) => ({
    type: QUEUE_DRAG_OVER as typeof QUEUE_DRAG_OVER,
    payload: { event },
});

export const queueDragDrop = (event: DragEvent) => ({
    type: QUEUE_DRAG_DROP as typeof QUEUE_DRAG_DROP,
    payload: { event },
});

export const generateInstanceId = () => ({
    type: ASSIGN_INSTANCE_ID as typeof ASSIGN_INSTANCE_ID,
    payload: String(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
});

export const hideToast = () => ({ type: HIDE_TOAST as typeof HIDE_TOAST });

export const showToast = (text: string, duration: number = 3000) => {
    if (duration < 0) {
        throw new Error('Toast duration < 0');
    }

    return {
        type: SHOW_TOAST as typeof SHOW_TOAST,
        payload: { duration, text },
    };
};
