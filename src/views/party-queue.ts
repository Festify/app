import { connect, html, withExtended } from 'fit-html';
import values from 'lodash-es/values';
import { createSelector } from 'reselect';

import { State, Track } from '../state';
import { repeat } from '../util/repeat';
import sharedStyles from '../util/shared-styles';

import './party-track';

export interface PartyQueueProps {
    tracks: Track[];
}

interface PartyQueueDispatch {
}

export const queueStyles = html`
    <style>
        :host {
            background-color: var(--track-bg);
            position: relative;
        }

        party-track:nth-child(even), party-track-search:nth-child(even) {
            background-color: var(--track-bg-even);
        }
    </style>
`;

/* tslint:disable:max-line-length */
const PartyQueue = (props: PartyQueueProps & PartyQueueDispatch) => html`
    ${sharedStyles}
    ${queueStyles}
    <style>
        party-track[playing] + party-track {
            padding-top: 13px;
        }

        paper-button {
            display: inline-block;
            margin: 20px;
        }

        p {
            margin: 0;
            text-align: center;
        }

        #skipBackground {
            position: absolute;
            right: 0;
            width: 100%;

            display: flex;
            align-items: flex-end;
            flex-direction: column;
            justify-content: center;

            height: 80px;
            pointer-events: none;
            transition: background-color 0.25s;
            z-index: 0;
        }

        #skipBackground.active {
            background-color: var(--primary-color);
        }

        #skipBackground p {
            line-height: 16px;
            margin: 0 32px 0 0;
            text-align: right;
        }
    </style>

    <div id="skipBackground"
         style$="display: [[_getDisplaySkipIndicator(tracks.length, state.isOwner)]]">
        <p id="skipIndicator">Skip</p>
    </div>

    ${repeat(props.tracks, track => `${track.reference.provider}-${track.reference.id}`, (track, i) => html`
        <party-track data-flip-id$="${track.reference.provider}-${track.reference.id}"
                     playing="${i === 0}"
                     trackid="${track.reference.provider}-${track.reference.id}">
        </party-track>
    `)}
`;
/* tslint:enable */

export const sortedTracksFactory = (
    tracksSelector: (state: State) => Record<string, Track> | null,
) => createSelector(
    tracksSelector,
    tracks => values(tracks).sort((a, b) => a.order - b.order),
);

const tracksSelector = (state: State) => state.party.tracks;
const sortedTracksSelector = sortedTracksFactory(tracksSelector);

const mapStateToProps = (state: State): PartyQueueProps => ({
    tracks: sortedTracksSelector(state),
});

const mapDispatchToProps: PartyQueueDispatch = {};

customElements.define(
    'party-queue',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        PartyQueue,
    )),
);
