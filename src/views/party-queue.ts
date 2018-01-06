import { connect, html, withExtended } from 'fit-html';

import { queueTracksSelector } from '../selectors/track';
import { State, Track } from '../state';
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

    ${props.tracks.map((track, i) => html`
        <party-track playing="${i === 0}"
                     trackid="${track.reference.provider}-${track.reference.id}">
        </party-track>
    `)}
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyQueueProps => ({
    tracks: queueTracksSelector(state),
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
