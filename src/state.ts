import { Location } from '@festify/redux-little-router';
import { User } from '@firebase/auth-types';

import { OAuthLoginProviders } from './actions/auth';
import { domainSelector } from './selectors/domain';

export const enum ConnectionState {
    Unknown,
    Connected,
    Disconnected,
}

export interface Image {
    height: number;
    url: string;
    width: number;
}

export interface Metadata {
    artists: string[];
    background?: string[];
    cover: Image[];
    durationMs: number;
    isPlayable: boolean;
    isrc?: string;
    name: string;
}

export interface Playback {
    last_change: number;
    last_position_ms: number;
    master_id: string | null;
    playing: boolean;
    target_playing: boolean | null;
}

export interface Playlist {
    name: string;
    reference: PlaylistReference;
    trackCount: number;
}

export interface PlaylistReference extends TrackReference {
    userId: string;
}

export interface Party {
    country: string;
    created_at: number;
    created_by: string;
    name: string;
    playback: Playback;
    settings?: PartySettings;
    short_id: string;
}

export interface PartySettings {
    /**
     * Toggles whether anonymous users can vote.
     *
     * This can be disabled to prevent vote cheating.
     */
    allow_anonymous_voters: boolean;

    /**
     * Toggles whether to allow explicit songs to be added to the party
     * via the search.
     *
     * Does not affect fallback playlists (intentionally).
     */
    allow_explicit_tracks: boolean;

    /**
     * Toggles whether the search menu closes after a guest has voted for
     * one track, or if multiple tracks can be added to the queue from search.
     */
    allow_multi_track_add: boolean;

    /**
     * Sets the text displayed under the progress bar in TV mode
     */
    tv_mode_text: string;

    /**
     * Sets the maximum track length in minutes
     */
    maximum_track_length: number | null;
}

// tslint:disable-next-line:no-namespace
export namespace PartySettings {
    export function defaultSettings(overrides?: Partial<PartySettings> | null): PartySettings {
        return {
            allow_anonymous_voters: true,
            allow_explicit_tracks: true,
            allow_multi_track_add: true,
            tv_mode_text: `Add your songs on ${domainSelector()}!`,
            maximum_track_length: null,
            ...overrides,
        };
    }
}

export interface Track {
    added_at: number;
    is_fallback: boolean;
    order: number;
    reference: TrackReference;
    played_at?: number;
    vote_count: number;
}

export interface TrackReference {
    id: string;
    provider: 'spotify';
}

/*
 * Redux state
 */

export interface AppShellState {
    currentToast: string | null;
}

export interface HomeViewState {
    partyCreationInProgress: boolean;
    partyCreationError: Error | null;
    partyJoinInProgress: boolean;
    partyJoinError: Error | null;
    partyId: string;
    partyIdValid: boolean;
}

export interface PartyState {
    connectionState: ConnectionState;
    currentParty: Party | null;
    hasTracksLoaded: boolean;
    partyLoadError: Error | null;
    partyLoadInProgress: boolean;
    tracks: Record<string, Track> | null;
    userVotes: Record<string, boolean> | null;
}

export interface PartyViewState {
    loginModalOpen: boolean;
    searchInProgress: boolean;
    searchError: Error | null;
    searchResult: Record<string, Track> | null;
    userMenuOpen: boolean;
}

export interface PlayerState {
    localDeviceId: string | null;
    instanceId: string;
    initializing: boolean;
    initializationError: Error | null;
    isCompatible: boolean;
    sdkReady: boolean;
    togglingPlayback: boolean;
    togglePlaybackError: Error | null;
}

export interface SettingsViewState {
    playlistLoadInProgress: boolean;
    playlistLoadError: Error | null;
    playlistSearchQuery: string;
    queueFlushInProgress: boolean;
    queueFlushError: Error | null;
    tracksLoadInProgress: boolean;
    tracksLoadError: Error | null;
    tracksToLoad: number;
    tracksLoaded: number;
}

export interface AuthProviderStatus<T> {
    authorizing: boolean;
    authorizationError: Error | null;
    statusKnown: boolean;
    user: T | null;
}

export interface UserCredentials {
    facebook: AuthProviderStatus<User>;
    firebase: AuthProviderStatus<User>;
    github: AuthProviderStatus<User>;
    google: AuthProviderStatus<User>;
    spotify: AuthProviderStatus<SpotifyApi.UserObjectPrivate>;
    twitter: AuthProviderStatus<User>;
}

export type EnabledProvidersList = {
    [k in OAuthLoginProviders]: boolean;
};

// tslint:disable-next-line:no-namespace
export namespace EnabledProvidersList {
    export function enable(overrides: OAuthLoginProviders[]): EnabledProvidersList {
        const result = {
            facebook: false,
            github: false,
            google: false,
            spotify: false,
            twitter: false,
        };
        overrides.forEach(prov => (result[prov] = true));
        return result;
    }
}

export interface UserState {
    credentials: UserCredentials;

    /**
     * The list of providers the user may sign in with, if he is required
     * to sign in with one of his previous OAuth providers. Otherwise null.
     */
    needsFollowUpSignInWithProviders: EnabledProvidersList | null;

    playlists: Playlist[];
}

export interface State {
    appShell: AppShellState;
    homeView: HomeViewState;
    metadata: Record<string, Metadata>;
    party: PartyState;
    partyView: PartyViewState;
    player: PlayerState;
    router: Location;
    settingsView: SettingsViewState;
    user: UserState;
}
