import { Location } from '@mraerino/redux-little-router-reactless';
import * as SpotifyApi from 'spotify-web-api-js';

export interface AuthProviderStatus<T> {
    statusKnown: boolean;
    user: T | null;
}

export interface UserState {
    spotify: AuthProviderStatus<SpotifyApi.UserObjectPrivate>;
    playlists: Playlist[];
}

export interface Image {
    height: number;
    url: string;
    width: number;
}

export interface Metadata {
    artists: string[];
    cover: Image[];
    durationMs: number;
    name: string;
}

export interface Playback {
    last_change: number;
    last_position_ms: number;
    playing: boolean;
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

export interface PartyState {
    currentParty: Party | null;
    tracks: Record<string, Track> | null;
    userVotes: Record<string, boolean> | null;
}

export interface TrackReference {
    id: string;
    provider: 'spotify';
}

export interface Track {
    added_at: number;
    is_fallback: boolean;
    order: number;
    reference: TrackReference;
    played_at?: number;
    vote_count: number;
}

export interface HomeViewState {
    partyId: string;
    partyIdValid: boolean;
}

export interface PartyViewState {
    searchInProgress: boolean;
    searchError: Error | null;
    searchResult: Record<string, Track> | null;
}

export interface ConnectPlaybackState {
    deviceId: boolean;
    name: string;
    playing: boolean;
}

export interface PlayerState {
    local: Spotify.PlaybackState | null;
    connect: ConnectPlaybackState | null;
}

export interface SettingsViewState {
    playlistLoadInProgress: boolean;
    playlistLoadError: Error | null;
    playlistSearchQuery: string;
    tracksLoadInProgress: boolean;
    tracksLoadError: Error | null;
    tracksToLoad: number;
    tracksLoaded: number;
}

export interface State {
    homeView: HomeViewState;
    metadata: Record<string, Metadata>;
    party: PartyState;
    partyView: PartyViewState;
    player: PlayerState;
    router?: Location;
    settingsView: SettingsViewState;
    user: UserState;
}
