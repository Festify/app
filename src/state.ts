import { Location } from '@mraerino/redux-little-router-reactless';
import * as SpotifyApi from 'spotify-web-api-js';

export interface AuthProviderStatus<T> {
    statusKnown: boolean;
    user: T | null;
}

export interface AuthState {
    spotify: AuthProviderStatus<SpotifyApi.UserObjectPrivate>;
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

export interface State {
    auth: AuthState;
    homeView: HomeViewState;
    metadata: Record<string, Metadata>;
    party: PartyState;
    partyView: PartyViewState;
    router?: Location;
}
