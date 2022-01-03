import shuffleArr from 'lodash-es/shuffle';

import { firebaseTrackIdSelector } from '../selectors/track';
import { PartySettings, Playlist, PlaylistReference, Track } from '../state';
import firebase from '../util/firebase';
import { fetchWithAccessToken } from '../util/spotify-auth';

export type Actions =
    | ReturnType<typeof changeSearchInput>
    | ReturnType<typeof changePartyName>
    | ReturnType<typeof changePartySetting>
    | ReturnType<typeof flushQueueStart>
    | ReturnType<typeof flushQueueFail>
    | ReturnType<typeof flushQueueFinish>
    | ReturnType<typeof insertPlaylistFail>
    | ReturnType<typeof insertPlaylistFinish>
    | ReturnType<typeof insertPlaylistProgress>
    | ReturnType<typeof insertPlaylistStart>
    | ReturnType<typeof loadPlaylistsFail>
    | ReturnType<typeof loadPlaylistsStart>
    | ReturnType<typeof updateUserPlaylists>;

export const UPDATE_PARTY_NAME = 'CHANGE_PARTYNAME';
export const CHANGE_PARTY_SETTING = 'CHANGE_PARTY_SETTING';
export const CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT = 'CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT';
export const FLUSH_QUEUE_FAIL = 'FLUSH_QUEUE_Fail';
export const FLUSH_QUEUE_FINISH = 'FLUSH_QUEUE_Finish';
export const FLUSH_QUEUE_START = 'FLUSH_QUEUE_Start';
export const LOAD_PLAYLISTS_FAIL = 'LOAD_PLAYLISTS_Fail';
export const LOAD_PLAYLISTS_START = 'LOAD_PLAYLISTS_Start';
export const INSERT_FALLBACK_PLAYLIST_FAIL = 'INSERT_FALLBACK_PLAYLIST_Fail';
export const INSERT_FALLBACK_PLAYLIST_FINISH = 'INSERT_FALLBACK_PLAYLIST_Finish';
export const INSERT_FALLBACK_PLAYLIST_PROGRESS = 'INSERT_FALLBACK_PLAYLIST_Progress';
export const INSERT_FALLBACK_PLAYLIST_START = 'INSERT_FALLBACK_PLAYLIST_Start';
export const UPDATE_USER_PLAYLISTS = 'UPDATE_USER_PLAYLISTS';

export const changePartyName = (newName: string) => ({
    type: UPDATE_PARTY_NAME as typeof UPDATE_PARTY_NAME,
    payload: newName,
});

export const changePartySetting = <K extends keyof PartySettings>(
    setting: K,
    value: PartySettings[K],
) => ({
    type: CHANGE_PARTY_SETTING as typeof CHANGE_PARTY_SETTING,
    payload: { value, setting },
});

export const changeSearchInput = (newContent: string) => ({
    type: CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT as typeof CHANGE_FALLBACK_PLAYLIST_SEARCH_INPUT,
    payload: newContent,
});

export const flushQueueFail = (err: Error) => ({
    type: FLUSH_QUEUE_FAIL as typeof FLUSH_QUEUE_FAIL,
    error: true,
    payload: err,
});

export const flushQueueFinish = () => ({ type: FLUSH_QUEUE_FINISH as typeof FLUSH_QUEUE_FINISH });

export const flushQueueStart = () => ({ type: FLUSH_QUEUE_START as typeof FLUSH_QUEUE_START });

export const loadPlaylistsFail = (err: Error) => ({
    type: LOAD_PLAYLISTS_FAIL as typeof LOAD_PLAYLISTS_FAIL,
    error: true,
    payload: err,
});

export const loadPlaylistsStart = () => ({
    type: LOAD_PLAYLISTS_START as typeof LOAD_PLAYLISTS_START,
});

export const insertPlaylistFail = (err: Error) => ({
    type: INSERT_FALLBACK_PLAYLIST_FAIL as typeof INSERT_FALLBACK_PLAYLIST_FAIL,
    error: true,
    payload: err,
});

export const insertPlaylistFinish = () => ({
    type: INSERT_FALLBACK_PLAYLIST_FINISH as typeof INSERT_FALLBACK_PLAYLIST_FINISH,
});

export const insertPlaylistProgress = (itemsProcessed: number) => ({
    type: INSERT_FALLBACK_PLAYLIST_PROGRESS as typeof INSERT_FALLBACK_PLAYLIST_PROGRESS,
    payload: itemsProcessed,
});

export const insertPlaylistStart = (playlist: Playlist, shuffled: boolean) => ({
    type: INSERT_FALLBACK_PLAYLIST_START as typeof INSERT_FALLBACK_PLAYLIST_START,
    payload: { playlist, shuffled },
});

export const updateUserPlaylists = (playlists: Playlist[]) => ({
    type: UPDATE_USER_PLAYLISTS as typeof UPDATE_USER_PLAYLISTS,
    payload: playlists,
});

/* Utils */

export async function flushQueue(partyId: string, tracks: Track[]) {
    const trackRemoveObject = {};
    tracks
        .filter((t) => !t.played_at)
        .map((t) => firebaseTrackIdSelector(t))
        .forEach((k) => (trackRemoveObject[k] = null));
    await Promise.all([
        firebase.database().ref('/tracks').child(partyId).update(trackRemoveObject),
        firebase.database().ref('/votes').child(partyId).remove(),
        firebase.database().ref('/votes_by_user').child(partyId).remove(),
    ]);
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
                .filter((it) => it && !it.is_local && it.track.id && it.track.is_playable !== false)
                .map((it) => it.track);

            if (typeof progress === 'function') {
                progress(items.length);
            }

            url = next;
            tracks.push(...trackItems);
        } while (url);

        return tracks;
    }
    async function removeFallbackTracks(partyId: string): Promise<void> {
        const fallbackTracks: Record<string, Track> | null = (
            await firebase
                .database()
                .ref('/tracks')
                .child(partyId)
                .orderByChild('vote_count')
                .equalTo(0)
                .once('value')
        ).val();

        if (!fallbackTracks) {
            return;
        }

        const removeObject = {};
        Object.keys(fallbackTracks)
            .filter((k) => !fallbackTracks[k].played_at)
            .forEach((k) => (removeObject[k] = null));

        await firebase.database().ref('/tracks').child(partyId).update(removeObject);
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

    await firebase.database().ref('/tracks').child(partyId).update(updateObject);
}
