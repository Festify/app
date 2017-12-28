import { connect, html, withExtended } from 'fit-html';

import { State } from "../state";
import { repeat } from "../util/repeat";
import sharedStyles from '../util/shared-styles';

import { queueStyles, sortedTracksFactory, PartyQueueProps } from "./party-queue";
import './party-track-search';

const PartySearchView = (props: PartyQueueProps) => html`
    ${sharedStyles}
    ${queueStyles}
    <style>
        party-track:first-of-type {
            padding-top: 16px;
            z-index: 1;
        }

        festify-spinner {
            background: var(--secondary-color);
        }
    </style>

    ${repeat(props.tracks, track => `${track.reference.provider}-${track.reference.id}`, (track, i) => html`
        <party-track-search trackid="${track.reference.provider}-${track.reference.id}">
        </party-track-search>
    `)}
`;

const tracksSelector = (state: State) => state.partyView.searchResult;
const sortedTrackSelector = sortedTracksFactory(tracksSelector);

const mapStateToProps = (state: State): PartyQueueProps => ({
    tracks: sortedTrackSelector(state),
});

customElements.define(
    'party-search',
    withExtended(connect(
        mapStateToProps,
        {},
        PartySearchView,
    )),
);
