import { Location } from '@mraerino/redux-little-router-reactless';

export interface Cover {
    [key: string]: string;
}

export interface Metadata {
    artists: string[];
    cover: Cover;
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

export interface HomeViewState {
    partyId: string;
    partyIdValid: boolean;
}

export type TracksState = Track[] | null;

export interface State {
    homeView: HomeViewState;
    metadata: Record<string, Metadata>;
    router?: Location;
    tracks: TracksState;
    party: PartyState;
}
