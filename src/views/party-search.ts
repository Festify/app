import '@polymer/paper-spinner/paper-spinner-lite';
import { connect, html, withExtended } from 'fit-html';

import { sortedTracksFactory } from '../selectors/track';
import { State } from "../state";
import { repeat } from "../util/repeat";
import sharedStyles from '../util/shared-styles';

import { queueStyles, PartyQueueProps } from "./party-queue";
import './party-track-search';

interface SearchProps extends PartyQueueProps {
    searchError: Error | null;
    searchInProgress: boolean;
}

const Progress = (props: SearchProps) => {
    if (props.searchInProgress) {
        return html`
            <div class="indicator">
                <paper-spinner-lite active alt="Loading search results..."></paper-spinner-lite>
            </div>
        `;
    } else if (props.searchError) {
        return html`
            <div class="indicator">
                <h2>⚡️ Oh, no!</h2>
                <h3>An error occured while searching. Please try again.</h3>
            </div>
        `;
    } else {
        // Repeat doesn't work if included conditionally
        return html``;
    }
};

const PartySearchView = (props: SearchProps) => html`
    ${sharedStyles}
    ${queueStyles}
    <style>
        party-track-search:first-of-type {
            padding-top: 16px;
            z-index: 1;
        }

        .indicator {
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
            margin: 32px;
            text-align: center;
        }

        festify-spinner {
            background: var(--secondary-color);
        }
    </style>

    ${Progress(props)}
    ${repeat(props.tracks, track => `${track.reference.provider}-${track.reference.id}`, (track, i) => html`
        <party-track-search trackid="${track.reference.provider}-${track.reference.id}">
        </party-track-search>
    `)}
`;

const tracksSelector = (state: State) => state.partyView.searchResult;
const sortedTrackSelector = sortedTracksFactory(tracksSelector);

const mapStateToProps = (state: State): SearchProps => ({
    searchError: state.partyView.searchError,
    searchInProgress: state.partyView.searchInProgress,
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
