import '@polymer/paper-spinner/paper-spinner-lite';
import { connect } from 'fit-html';
import { html } from 'lit-html';

import { sortedTracksFactory } from '../selectors/track';
import { State, Track } from '../state';
import sharedStyles from '../util/shared-styles';

import { queueStyles } from './party-queue';
import './party-track-search';

interface SearchProps {
    searchError: Error | null;
    searchInProgress: boolean;
    tracks: Track[];
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
        return null;
    }
};

const PartySearchView = (props: SearchProps) => html`
    ${sharedStyles} ${queueStyles}
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

        paper-spinner-lite {
            background: var(--secondary-color);
        }
    </style>

    ${Progress(props)}
    ${props.tracks.map(
        (track, i) => html`
            <party-track-search trackid="${track.reference.provider}-${track.reference.id}">
            </party-track-search>
        `,
    )}
`;

const tracksSelector = (state: State) => state.partyView.searchResult;
const sortedTrackSelector = sortedTracksFactory(tracksSelector);

const mapStateToProps = (state: State): SearchProps => ({
    searchError: state.partyView.searchError,
    searchInProgress: state.partyView.searchInProgress,
    tracks: sortedTrackSelector(state),
});

customElements.define('party-search', connect(mapStateToProps, {})(PartySearchView));
