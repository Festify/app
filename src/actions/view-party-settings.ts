import shuffleArr from 'lodash-es/shuffle';
import * as SpotifyApi from 'spotify-web-api-js';

import { firebaseTrackIdSelector } from '../selectors/track';
import { Playlist, PlaylistReference, Track } from '../state';
import firebase from '../util/firebase';
import { fetchWithAccessToken } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';

export type Actions =
    | ChangeDisplayKenBurnsBackgroundAction
    | ChangeFallbackPlaylistSearchInputAction
    | FlushQueueFailAction
    | FlushQueueFinishAction
    | FlushQueueStartAction
    | InsertFallbackPlaylistFailAction
    | InsertFallbackPlaylistFinishAction
    | InsertFallbackPlaylistProgressAction
    | InsertFallbackPlaylistStartAction
    | LoadPlaylistsStartAction
    | LoadPlaylistsFailAction
    | UpdatePartyNameAction
    | UpdateUserPlaylistsAction;

export interface ChangeDisplayKenBurnsBackgroundAction extends PayloadAction<boolean> {
    type: Types.CHANGE_DISPLAY_KEN_BURNS_BACKGROUND;
}

export interface ChangeFallbackPlaylistSearchInputAction extends PayloadAction<string> {
    type: Types.CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT;
}

export interface FlushQueueFailAction extends ErrorAction {
    type: Types.FLUSH_QUEUE_Fail;
}

export interface FlushQueueFinishAction {
    type: Types.FLUSH_QUEUE_Finish;
}

export interface FlushQueueStartAction {
    type: Types.FLUSH_QUEUE_Start;
}

export interface InsertFallbackPlaylistFailAction extends ErrorAction {
    type: Types.INSERT_FALLBACK_PLAYLIST_Fail;
}

export interface InsertFallbackPlaylistFinishAction {
    type: Types.INSERT_FALLBACK_PLAYLIST_Finish;
}

export interface InsertFallbackPlaylistProgressAction extends PayloadAction<number> {
    type: Types.INSERT_FALLBACK_PLAYLIST_Progress;
}

export interface InsertFallbackPlaylistStartAction extends PayloadAction<{ playlist: Playlist, shuffled: boolean }> {
    type: Types.INSERT_FALLBACK_PLAYLIST_Start;
}

export interface LoadPlaylistsStartAction {
    type: Types.LOAD_PLAYLISTS_Start;
}

export interface LoadPlaylistsFailAction extends ErrorAction {
    type: Types.LOAD_PLAYLISTS_Fail;
}

export interface UpdatePartyNameAction extends PayloadAction<string> {
    type: Types.UPDATE_PARTY_NAME;
}

export interface UpdateUserPlaylistsAction extends PayloadAction<Playlist[]> {
    type: Types.UPDATE_USER_PLAYLISTS;
}

export function changeDisplayKenBurnsBackground(display: boolean): ChangeDisplayKenBurnsBackgroundAction {
    return {
        type: Types.CHANGE_DISPLAY_KEN_BURNS_BACKGROUND,
        payload: display,
    };
}

export function changePartyName(newName: string): UpdatePartyNameAction {
    return {
        type: Types.UPDATE_PARTY_NAME,
        payload: newName,
    };
}

export function changeSearchInput(newContent: string): ChangeFallbackPlaylistSearchInputAction {
    return {
        type: Types.CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT,
        payload: newContent,
    };
}

export async function flushQueue(partyId: string, tracks: Track[]) {
    const trackRemoveObject = {};
    tracks.filter(t => !t.played_at)
        .map(t => firebaseTrackIdSelector(t))
        .forEach(k => trackRemoveObject[k] = null);
    await Promise.all([
        firebase.database!()
            .ref('/tracks')
            .child(partyId)
            .update(trackRemoveObject),
        firebase.database!()
            .ref('/votes')
            .child(partyId)
            .remove(),
        firebase.database!()
            .ref('/votes_by_user')
            .child(partyId)
            .remove(),
    ]);
}

export function flushQueueFail(err: Error): FlushQueueFailAction {
    return {
        type: Types.FLUSH_QUEUE_Fail,
        error: true,
        payload: err,
    };
}

export function flushQueueFinish(): FlushQueueFinishAction {
    return { type: Types.FLUSH_QUEUE_Finish };
}

export function flushQueueStart(): FlushQueueStartAction {
    return { type: Types.FLUSH_QUEUE_Start };
}

export async function loadPlaylists(): Promise<Playlist[]> {
    const items: SpotifyApi.PlaylistObjectSimplified[] = [];
    let url = '/me/playlists?limit=50';
    do {
        const resp = await fetchWithAccessToken(url);
        const body: SpotifyApi.ListOfUsersPlaylistsResponse = await resp.json();

        items.push(...body.items);
        url = body.next;
    } while (url);

    return items.map(({ name, id, owner, tracks }) => ({
        name,
        reference: {
            id,
            provider: 'spotify',
            userId: owner.id,
        } as PlaylistReference,
        trackCount: tracks.total,
    }));
}

export function loadPlaylistsFail(err: Error): LoadPlaylistsFailAction {
    return {
        type: Types.LOAD_PLAYLISTS_Fail,
        error: true,
        payload: err,
    };
}

export function loadPlaylistsStart(): LoadPlaylistsStartAction {
    return { type: Types.LOAD_PLAYLISTS_Start };
}

export async function insertPlaylist(
    partyId: string,
    partyCreationDate: number,
    playlist: Playlist,
    shuffle: boolean = false,
    progress?: (amount: number) => any,
) {
    async function fetchTracks(
        playlist: Playlist,
        progress?: (amount: number) => any,
    ): Promise<SpotifyApi.TrackObjectFull[]> {
        let url = `/users/${playlist.reference.userId}/playlists/${playlist.reference.id}/tracks?market=from_token`;

        const tracks: SpotifyApi.TrackObjectFull[] = [];

        do {
            const resp = await fetchWithAccessToken(url);
            const { items, next }: SpotifyApi.PlaylistTrackResponse = await resp.json();
            const trackItems = items
                .filter(it => it && !it.is_local && it.track && it.track.id && it.track.is_playable !== false)
                .map(it => it.track);

            if (typeof progress === 'function') {
                progress(items.length);
            }

            url = next;
            tracks.push(...trackItems);
        } while (url);

        return tracks;
    }
    async function removeFallbackTracks(partyId: string): Promise<void> {
        const fallbackTracks: Record<string, Track> | null = (await firebase.database!()
            .ref('/tracks')
            .child(partyId)
            .orderByChild('vote_count')
            .equalTo(0)
            .once('value'))
            .val();

        if (!fallbackTracks) {
            return;
        }

        const removeObject = {};
        Object.keys(fallbackTracks)
            .filter(k => !fallbackTracks[k].played_at)
            .forEach(k => removeObject[k] = null);

        await firebase.database!()
            .ref('/tracks')
            .child(partyId)
            .update(removeObject);
    }

    if (typeof progress === 'function') {
        progress(0);
    }

    let [tracks] = await Promise.all([
        fetchTracks(playlist, progress),
        removeFallbackTracks(partyId),
    ]);

    if (shuffle) {
        tracks = shuffleArr(tracks);
    }

    const now = Date.now();
    const base = now - partyCreationDate;
    const updateObject = tracks.reduce((acc, track, index) => {
        acc[`spotify-${track.id}`] = {
            added_at: now + index,
            is_fallback: true,
            order: base + index,
            reference: {
                id: track.id,
                provider: 'spotify',
            },
            vote_count: 0,
        };
        return acc;
    }, {});

    await firebase.database!()
        .ref('/tracks')
        .child(partyId)
        .update(updateObject);
}

export function insertPlaylistFail(err: Error): InsertFallbackPlaylistFailAction {
    return {
        type: Types.INSERT_FALLBACK_PLAYLIST_Fail,
        error: true,
        payload: err,
    };
}

export function insertPlaylistFinish(): InsertFallbackPlaylistFinishAction {
    return { type: Types.INSERT_FALLBACK_PLAYLIST_Finish };
}

export function insertPlaylistProgress(itemsProcessed: number): InsertFallbackPlaylistProgressAction {
    return {
        type: Types.INSERT_FALLBACK_PLAYLIST_Progress,
        payload: itemsProcessed,
    };
}

export function insertPlaylistStart(playlist: Playlist, shuffled: boolean): InsertFallbackPlaylistStartAction {
    return {
        type: Types.INSERT_FALLBACK_PLAYLIST_Start,
        payload: { playlist, shuffled },
    };
}

export function updateUserPlaylists(playlists: Playlist[]): UpdateUserPlaylistsAction {
    return {
        type: Types.UPDATE_USER_PLAYLISTS,
        payload: playlists,
    };
}
