import { connect, html, withExtended } from 'fit-html';
import { repeat } from 'lit-html/lib/repeat';
import values from 'lodash-es/values';

import { State, Track } from '../state';
import sharedStyles from '../util/shared-styles';

import './party-track';

interface PartyQueueProps {
    tracks: Track[];
}

interface PartyQueueDispatch {
}

/* tslint:disable:max-line-length */
const PartyQueue = (props: PartyQueueProps & PartyQueueDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            background-color: var(--track-bg);
            position: relative;
        }

        :host([view=search]) party-track:first-of-type {
            padding-top: 16px;
            z-index: 1;
        }

        party-track:nth-child(even) {
            background-color: var(--track-bg-even);
        }

        party-track[playing] + party-track {
            padding-top: 13px;
        }

        p {
            margin: 0;
            text-align: center;
        }

        paper-button {
            display: inline-block;
            margin: 20px;
        }

        festify-spinner {
            background: var(--secondary-color);
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

    <dom-flip>
        ${repeat(props.tracks, track => `${track.reference.provider}-${track.reference.id}`, (track, i) => html`
            <party-track data-flip-id$="${track.reference.provider}-${track.reference.id}"
                         playing="${i === 0}"
                         track-id="${track.id}">
            </party-track>
        `)}
    </dom-flip>
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyQueueProps => ({
    tracks: values(state.tracks).sort((a, b) => a.order - b.order),
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
