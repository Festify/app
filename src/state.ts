import { Location } from '@mraerino/redux-little-router-reactless';
import * as SpotifyApi from 'spotify-web-api-js';

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
    short_id: string;
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
    searchInProgress: boolean;
    searchError: Error | null;
    searchResult: Record<string, Track> | null;
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
    syncedPlayback: boolean;
    tracksLoadInProgress: boolean;
    tracksLoadError: Error | null;
    tracksToLoad: number;
    tracksLoaded: number;
}

export interface TvViewState {
    displayKenBurnsBackground: boolean;
}

export interface AuthProviderStatus<T> {
    authorizing: boolean;
    authorizationError: Error | null;
    statusKnown: boolean;
    user: T | null;
}

export interface UserState {
    spotify: AuthProviderStatus<SpotifyApi.UserObjectPrivate>;
    playlists: Playlist[];
}

export interface State {
    appShell: AppShellState;
    homeView: HomeViewState;
    metadata: Record<string, Metadata>;
    party: PartyState;
    partyView: PartyViewState;
    player: PlayerState;
    router?: Location;
    settingsView: SettingsViewState;
    tvView: TvViewState;
    user: UserState;
}
