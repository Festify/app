import { Location } from '@mraerino/redux-little-router-reactless';

export interface Image {
    height: number;
    url: string;
    width: number;
}

export interface Metadata {
    artists: string[];
    cover: Image[];
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
    id: string;
    name: string;
    playback: Playback;
    short_id: string;
}

export type PartyState = Party | null;

export interface Reference {
    id: string;
    provider: 'spotify';
}

export interface Track {
    added_at: number;
    id: string;
    is_fallback: boolean;
    order: number;
    reference: Reference;
    vote_count: number;
}

export type TracksState = Record<string, Track> | null;

export interface HomeViewState {
    partyId: string;
    partyIdValid: boolean;
}

export interface PartyViewState {
    searchInput: string;
}

export interface State {
    homeView: HomeViewState;
    metadata: Record<string, Metadata>;
    party: PartyState;
    partyView: PartyViewState;
    router?: Location;
    tracks: TracksState;
}
