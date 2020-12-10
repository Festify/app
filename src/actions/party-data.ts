import { ConnectionState, Party, PartySettings, Playback, Track } from '../state';
import { requireAuth } from '../util/auth';
import firebase, { firebaseNS } from '../util/firebase';

export type Actions =
    | ReturnType<typeof becomePlaybackMaster>
    | ReturnType<typeof cleanupParty>
    | ReturnType<typeof createPartyFail>
    | ReturnType<typeof createPartyStart>
    | ReturnType<typeof installPlaybackMaster>
    | ReturnType<typeof joinPartyFail>
    | ReturnType<typeof joinPartyStart>
    | ReturnType<typeof resignPlaybackMaster>
    | ReturnType<typeof openPartyFail>
    | ReturnType<typeof openPartyFinish>
    | ReturnType<typeof openPartyStart>
    | ReturnType<typeof updateConnectionState>
    | ReturnType<typeof updateParty>
    | ReturnType<typeof updateTracks>
    | ReturnType<typeof updateUserVotes>
    | ReturnType<typeof updatePlaybackState>;

export const BECOME_PLAYBACK_MASTER = 'BECOME_PLAYBACK_MASTER';
export const CLEANUP_PARTY = 'CLEANUP_PARTY';
export const CREATE_PARTY_FAIL = 'CREATE_PARTY_Fail';
export const CREATE_PARTY_START = 'CREATE_PARTY_Start';
export const JOIN_PARTY_FAIL = 'JOIN_PARTY_Fail';
export const JOIN_PARTY_START = 'JOIN_PARTY_Start';
export const INSTALL_PLAYBACK_MASTER = 'INSTALL_PLAYBACK_MASTER';
export const OPEN_PARTY_FAIL = 'OPEN_PARTY_Fail';
export const OPEN_PARTY_FINISH = 'OPEN_PARTY_Finish';
export const OPEN_PARTY_START = 'OPEN_PARTY_Start';
export const RESIGN_PLAYBACK_MASTER = 'RESIGN_PLAYBACK_MASTER';
export const UPDATE_NETWORK_CONNECTION_STATE = 'UPDATE_NETWORK_CONNECTION_STATE';
export const UPDATE_PARTY = 'UPDATE_PARTY';
export const UPDATE_TRACKS = 'UPDATE_TRACKS';
export const UPDATE_USER_VOTES = 'UPDATE_USER_VOTES';
export const UPDATE_PLAYBACK_STATE = 'UPDATE_PLAYBACK_STATE';

export const becomePlaybackMaster = () => ({
    type: BECOME_PLAYBACK_MASTER as typeof BECOME_PLAYBACK_MASTER,
});

export const cleanupParty = () => ({ type: CLEANUP_PARTY as typeof CLEANUP_PARTY });

export const createPartyFail = (err: Error) => ({
    type: CREATE_PARTY_FAIL as typeof CREATE_PARTY_FAIL,
    error: true,
    payload: err,
});

export const createPartyStart = () => ({ type: CREATE_PARTY_START as typeof CREATE_PARTY_START });

export const joinPartyFail = (err: Error) => ({
    type: JOIN_PARTY_FAIL as typeof JOIN_PARTY_FAIL,
    error: true,
    payload: err,
});

export const joinPartyStart = () => ({ type: JOIN_PARTY_START as typeof JOIN_PARTY_START });

export const installPlaybackMaster = () => ({
    type: INSTALL_PLAYBACK_MASTER as typeof INSTALL_PLAYBACK_MASTER,
});

export const openPartyFail = (err: Error) => ({
    type: OPEN_PARTY_FAIL as typeof OPEN_PARTY_FAIL,
    error: true,
    payload: err,
});

export const openPartyFinish = (party: Party) => ({
    type: OPEN_PARTY_FINISH as typeof OPEN_PARTY_FINISH,
    payload: party,
});

export const openPartyStart = (id: string) => ({
    type: OPEN_PARTY_START as typeof OPEN_PARTY_START,
    payload: id,
});

export const resignPlaybackMaster = () => ({
    type: RESIGN_PLAYBACK_MASTER as typeof RESIGN_PLAYBACK_MASTER,
});

export const updateConnectionState = (isConnected: ConnectionState) => ({
    type: UPDATE_NETWORK_CONNECTION_STATE as typeof UPDATE_NETWORK_CONNECTION_STATE,
    payload: isConnected,
});

export const updateParty = (party: Party) => ({
    type: UPDATE_PARTY as typeof UPDATE_PARTY,
    payload: party,
});

export const updateTracks = (tracks: Record<string, Track> | null) => ({
    type: UPDATE_TRACKS as typeof UPDATE_TRACKS,
    payload: tracks,
});

export const updateUserVotes = (votes: Record<string, boolean> | null) => ({
    type: UPDATE_USER_VOTES as typeof UPDATE_USER_VOTES,
    payload: votes,
});

export const updatePlaybackState = (playback: Partial<Playback>) => ({
    type: UPDATE_PLAYBACK_STATE as typeof UPDATE_PLAYBACK_STATE,
    payload: playback,
});

/* Utils */

export async function createNewParty(
    displayName: string,
    masterId: string,
    country: string,
    settings: PartySettings,
): Promise<string> {
    const { uid } = await requireAuth();
    const now = firebaseNS.database!.ServerValue.TIMESTAMP;
    const userNamePosessive = displayName.endsWith('s') ? "'" : "'s";

    const party: Party = {
        country,
        created_at: now as any,
        created_by: uid,
        name: `${displayName}${userNamePosessive} Party`,
        playback: {
            last_change: now as any,
            last_position_ms: 0,
            master_id: null,
            playing: false,
            target_playing: null,
        },
        settings,
        short_id: String(Math.floor(Math.random() * 1000000)),
    };

    const result = await firebase
        .database()
        .ref('/parties')
        .push(party);

    if (!result.key) {
        throw new Error('Missing ID of newly created party!');
    }

    return result.key;
}

export async function resolveShortId(shortId: string): Promise<string | null> {
    const snapshot = await firebase
        .database()
        .ref('/parties')
        .orderByChild('short_id')
        .equalTo(shortId)
        .once('value');

    if (snapshot.numChildren() < 1) {
        return null;
    }

    const result: Record<string, Party> = snapshot.val();
    const possibleLongId = Object.keys(result).reduce(
        (acc, k) =>
            result[k].created_at > (result[acc] || { created_at: -1 }).created_at ? k : acc,
        '',
    );

    return possibleLongId || null; // Filter out empty IDs
}
