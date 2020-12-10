import { connect } from 'fit-html';
import { createSelector } from 'reselect';

import { State, Track } from '../state';

import {
    createMapStateToPropsFactory,
    mapDispatchToProps,
    PartyTrackElementBase,
} from './party-track';

const trackSelector = (state: State, trackId: string) =>
    state.partyView.searchResult ? state.partyView.searchResult[trackId] : null;
const voteCountSelector = (state: State, trackId: string) =>
    state.party.tracks && state.party.tracks[trackId] ? state.party.tracks[trackId].vote_count : 0;
const enhancedTrackSelector = createSelector(
    trackSelector,
    voteCountSelector,
    (track: Track, voteCount: number) => ({ ...track, vote_count: voteCount }),
);

customElements.define(
    'party-track-search',
    connect(
        createMapStateToPropsFactory(enhancedTrackSelector),
        mapDispatchToProps,
    )(PartyTrackElementBase),
);
