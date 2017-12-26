import { Location } from '@mraerino/redux-little-router-reactless';

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

export interface Reference {
    id: string;
    provider: 'spotify';
}

export interface Track {
    added_at: number;
    is_fallback: boolean;
    order: number;
    reference: Reference;
    vote_count: number;
}

export interface HomeViewState {
    partyId: string;
    partyIdValid: boolean;
}

export interface State {
    homeView: HomeViewState;
    router?: Location;
    tracks: Track[] | null;
}
