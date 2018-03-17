import 'dom-flip';
import { connect } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';

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
const List = (props: PartyQueueProps & PartyQueueDispatch) => {
    const list = props.tracks.map((track, i) => html`
        <party-track playing?="${i === 0}"
                     data-flip-id$="${track.reference.provider}-${track.reference.id}"
                     trackid$="${track.reference.provider}-${track.reference.id}">
        </party-track>
    `);

    // ShadyCSS + lit-html + dom-flip breaks in Firefox causing the track elements
    // not to be instantiated. Thus, no dom-flip for Firefox.
    return (window as any).ShadyCSS
        ? html`<div>${list}</div>`
        : html`<dom-flip>${list}</dom-flip>`;
};

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
    </style>

    ${List(props)}
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyQueueProps => ({
    tracks: queueTracksSelector(state),
});

const mapDispatchToProps: PartyQueueDispatch = {};

customElements.define(
    'party-queue',
    connect(
        mapStateToProps,
        mapDispatchToProps,
        PartyQueue,
    ),
);
