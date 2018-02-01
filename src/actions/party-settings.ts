import shuffleArr from 'lodash-es/shuffle';
import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import * as SpotifyApi from 'spotify-web-api-js';

import { partyIdSelector } from '../selectors/party';
import { Playlist, PlaylistReference, State, Track } from '../state';
import firebase from '../util/firebase';
import { fetchWithAccessToken } from '../util/spotify-auth';

import { ErrorAction, PayloadAction, Types } from '.';
import { loadSpotifyMetadata } from './metadata';

export type Actions =
    | ChangeFallbackPlaylistSearchInputAction
    | InsertFallbackPlaylistFailAction
    | InsertFallbackPlaylistFinishAction
    | InsertFallbackPlaylistProgressAction
    | InsertFallbackPlaylistStartAction
    | LoadPlaylistsStartAction
    | LoadPlaylistsFailAction
    | UpdateUserPlaylistsAction;

export interface ChangeFallbackPlaylistSearchInputAction extends PayloadAction<string> {
    type: Types.CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT;
}

export interface InsertFallbackPlaylistFailAction extends ErrorAction {
    type: Types.INSERT_FALLBACK_PLAYLIST_Finish;
}

export interface InsertFallbackPlaylistFinishAction {
    type: Types.INSERT_FALLBACK_PLAYLIST_Finish;
}

export interface InsertFallbackPlaylistProgressAction extends PayloadAction<number> {
    type: Types.INSERT_FALLBACK_PLAYLIST_Progress;
}

export interface InsertFallbackPlaylistStartAction extends PayloadAction<number> {
    type: Types.INSERT_FALLBACK_PLAYLIST_Start;
}

export interface LoadPlaylistsStartAction {
    type: Types.LOAD_PLAYLISTS_Start;
}

export interface LoadPlaylistsFailAction extends ErrorAction {
    type: Types.LOAD_PLAYLISTS_Fail;
}

export interface UpdateUserPlaylistsAction extends PayloadAction<Playlist[]> {
    type: Types.UPDATE_USER_PLAYLISTS;
}

export function changePartyName(newName: string): ThunkAction<Promise<void>, State, void> {
    return (dispatch, getState) => {
        const partyId = partyIdSelector(getState());

        if (!partyId) {
            throw new Error("Missing party ID!");
        }

        return firebase.database!()
            .ref('/parties')
            .child(partyId)
            .child('name')
            .set(newName);
    };
}

export function changeSearchInput(newContent: string): ChangeFallbackPlaylistSearchInputAction {
    return {
        type: Types.CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT,
        payload: newContent,
    };
}

export function fetchPlaylists(): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const { playlistLoadInProgress } = getState().settingsView;
        if (playlistLoadInProgress) {
            return;
        }

        dispatch({ type: Types.LOAD_PLAYLISTS_Start } as LoadPlaylistsStartAction);

        const items: SpotifyApi.PlaylistObjectSimplified[] = [];
        try {
            let url = '/me/playlists?limit=50';
            do {
                const resp = await fetchWithAccessToken(url);
                const body: SpotifyApi.ListOfUsersPlaylistsResponse = await resp.json();

                items.push(...body.items);
                url = body.next;
            } while (url);
        } catch (err) {
            dispatch({
                type: Types.LOAD_PLAYLISTS_Fail,
                error: true,
                payload: err,
            } as LoadPlaylistsFailAction);
            return;
        }

        const reducedData: Playlist[] = items.map(({ name, id, owner, tracks }) => ({
            name,
            reference: {
                id,
                provider: 'spotify',
                userId: owner.id,
            } as PlaylistReference,
            trackCount: tracks.total,
        }));
        dispatch(updateUserPlaylists(reducedData));
    };
}

export function insertPlaylist(
    playlist: Playlist,
    shuffle: boolean = false,
): ThunkAction<Promise<void>, State, void> {
    return async (dispatch, getState) => {
        const state = getState();
        const partyId = partyIdSelector(state);
        const { currentParty } = state.party;

        if (!partyId || !currentParty) {
            throw new Error("Missing party!");
        }

        dispatch(startInsertPlaylist(playlist.trackCount));

        let tracks: SpotifyApi.TrackObjectFull[];
        try {
            const [t] = await Promise.all([
                fetchTracks(playlist, dispatch),
                removeOldTracks(partyId),
            ]);
            tracks = t;
        } catch (err) {
            dispatch({
                type: Types.INSERT_FALLBACK_PLAYLIST_Fail,
                error: true,
                payload: err,
            });
            return;
        }

        if (shuffle) {
            tracks = shuffleArr(tracks);
        }

        const now = Date.now();
        const base = now - currentParty.created_at;
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

        try {
            await firebase.database!()
                .ref('/tracks')
                .child(partyId)
                .update(updateObject);
        } catch (err) {
            dispatch({
                type: Types.INSERT_FALLBACK_PLAYLIST_Fail,
                error: true,
                payload: err,
            });
            return;
        }

        dispatch({ type: Types.INSERT_FALLBACK_PLAYLIST_Finish } as InsertFallbackPlaylistFinishAction);
    };
}

async function fetchTracks(playlist: Playlist, dispatch: Dispatch<State>): Promise<SpotifyApi.TrackObjectFull[]> {
    let url = `/users/${playlist.reference.userId}/playlists/${playlist.reference.id}/tracks`
        + `?fields=items(track(album(images),artists,duration_ms,id,name)),next&market=from_token`;

    const tracks: SpotifyApi.TrackObjectFull[] = [];

    do {
        const resp = await fetchWithAccessToken(url);
        const json: SpotifyApi.PlaylistTrackResponse = await resp.json();
        const trackItems = json.items
            .map(it => it.track)
            .filter(track => track.id);

        dispatch(loadSpotifyMetadata(trackItems));
        dispatch(insertPlaylistProgress(json.items.length));

        url = json.next;
        tracks.push(...trackItems);
    } while (url);

    return tracks;
}

async function removeOldTracks(partyId: string): Promise<void> {
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

export function startInsertPlaylist(trackCount: number): InsertFallbackPlaylistStartAction {
    return {
        type: Types.INSERT_FALLBACK_PLAYLIST_Start,
        payload: trackCount,
    };
}

export function insertPlaylistProgress(itemsProcessed: number): InsertFallbackPlaylistProgressAction {
    return {
        type: Types.INSERT_FALLBACK_PLAYLIST_Progress,
        payload: itemsProcessed,
    };
}

export function updateUserPlaylists(playlists: Playlist[]): UpdateUserPlaylistsAction {
    return {
        type: Types.UPDATE_USER_PLAYLISTS,
        payload: playlists,
    };
}
