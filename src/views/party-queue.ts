import 'dom-flip';
import { connect } from 'fit-html';
import { html } from 'lit-html';

import { handleLinkClick } from '../actions/nav';
import { isPartyOwnerSelector } from '../selectors/party';
import { settingsRouteSelector } from '../selectors/routes';
import { queueTracksSelector } from '../selectors/track';
import { State, Track } from '../state';
import sharedStyles from '../util/shared-styles';

import './party-track';

export interface PartyQueueProps {
    hasTracksLoaded: boolean;
    isOwner: boolean;
    settingsRoute: string;
    tracks: Track[];
}

interface PartyQueueDispatch {
    handleClick: (ev: Event) => void;
}

export const queueStyles = html`
    <style>
        :host {
            background-color: var(--track-bg);
            position: relative;
        }

        party-track:nth-child(even),
        party-track-search:nth-child(even) {
            background-color: var(--track-bg-even);
        }
    </style>
`;

/* tslint:disable:max-line-length */
const List = (props: PartyQueueProps & PartyQueueDispatch) => {
    if (!props.hasTracksLoaded) {
        return html`
            <div class="spinner">
                <paper-spinner-lite active alt="Loading tracks..."></paper-spinner-lite>
            </div>
        `;
    }
    if (!props.tracks.length) {
        const inner = props.isOwner
            ? html`
                  <a href="${props.settingsRoute}" @click=${props.handleClick}> Go to settings</a>
                  to add a fallback playlist
              `
            : 'Search for your favourite tracks and add them to the queue';

        return html`
            <h2>🌝 The queue is empty!</h2>
            <h3>${inner}</h3>
        `;
    }

    const list = props.tracks.map(
        (track, i) => html`
            <party-track
                ?playing=${i === 0}
                data-flip-id="${track.reference.provider}-${track.reference.id}"
                .trackid="${track.reference.provider}-${track.reference.id}"
            >
            </party-track>
        `,
    );

    // ShadyCSS + lit-html + dom-flip breaks in Firefox causing the track elements
    // not to be instantiated. Thus, no dom-flip in environments where there isn't support
    // for native Shady DOM yet.
    return window.ShadyCSS && !window.ShadyCSS.nativeShadow
        ? html`
              <div>${list}</div>
          `
        : html`
              <dom-flip>${list}</dom-flip>
          `;
};

const PartyQueue = (props: PartyQueueProps & PartyQueueDispatch) => html`
    ${sharedStyles} ${queueStyles}
    <style>
        .spinner {
            display: flex;
            justify-content: center;
            margin: 32px;
        }

        party-track[playing] + party-track {
            padding-top: 13px;
        }

        h2,
        h3 {
            margin-left: 16px;
            margin-right: 16px;
            text-align: center;
        }
    </style>

    ${List(props)}
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyQueueProps => ({
    hasTracksLoaded: state.party.hasTracksLoaded,
    isOwner: isPartyOwnerSelector(state),
    settingsRoute: settingsRouteSelector(state)!,
    tracks: queueTracksSelector(state),
});

const mapDispatchToProps: PartyQueueDispatch = {
    handleClick: handleLinkClick,
};

customElements.define('party-queue', connect(mapStateToProps, mapDispatchToProps)(PartyQueue));
