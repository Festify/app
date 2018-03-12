import 'dom-flip';
import { connect } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';
import { createSelector } from 'reselect';

import srcsetImg from '../components/srcset-img';
import {
    artistJoinerFactory,
    currentTrackIdSelector,
    queueTracksSelector,
    singleMetadataSelector,
} from '../selectors/track';
import { Metadata, Party, State, Track } from '../state';
import festifyLogo from '../util/festify-logo';
import sharedStyles from '../util/shared-styles';

import './tv-track';

interface ViewTvProps {
    currentTrackArtistName: string | null;
    currentTrackMetadata: Metadata | null;
    domain: string;
    initError: Error | null;
    isLoading: boolean;
    metadata: Record<string, Metadata>;
    party: Party | null;
    queueTracks: Track[];
}

const Body = (props: ViewTvProps) => {
    if (props.isLoading) {
        return html`
            <div class="no-tracks">
                <div class="header">
                    ${festifyLogo}
                    <h1>Loading...</h1>
                </div>
            </div>
        `;
    } else if (props.initError) {
        return html`
            <div class="no-tracks">
                <div class="header">
                    <span class="flash">⚡️</span>
                    <h1>Oh, no!</h1>
                </div>
                <h2>The party could not be loaded. The following error occured:</h2>
                <h2>${props.initError.message}</h2>
            </div>
        `;
    } else if (props.currentTrackMetadata) {
        return html`
            <div class="background">
                ${srcsetImg(props.currentTrackMetadata.cover, '100vw', '')}
            </div>

            <div class="upper">
                <div class="playing-track">
                    ${srcsetImg(props.currentTrackMetadata.cover, '49vh')}

                    <div class="metadata">
                        <h2>${props.currentTrackMetadata.name}</h2>
                        <h3>${props.currentTrackArtistName}</h3>

                        <playback-progress-bar></playback-progress-bar>

                        <h4>Go to ${props.domain} and vote for the music!</h4>
                        <h5>${props.party && props.party.short_id}</h5>
                    </div>
                </div>
            </div>
            <dom-flip class="lower">
                ${props.queueTracks.map(t => html`
                    <tv-track trackid="${t.reference.provider}-${t.reference.id}"
                              data-flip-id$="${t.reference.provider}-${t.reference.id}">
                    </tv-track>
                `)}
            </dom-flip>
        `;
    } else {
        return html`
            <div class="no-tracks">
                <div class="header">
                    ${festifyLogo}
                    <h1>Oh, no!</h1>
                </div>
                <h2>There are no tracks in the queue right now.</h2>
                <h2>Enter ${props.party && props.party.short_id} on ${props.domain} and vote for new ones!</h2>
            </div>
        `;
    }
};

/* tslint:disable:max-line-length */
const ViewTv = (props: ViewTvProps) => html`
    ${sharedStyles}
    <style>
        :host {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            position: absolute;
            top: 0; left: 0;
            bottom: 0; right: 0;
            overflow: hidden;
            font-size: 5.278vh;
        }

        :host(.nocursor) {
            cursor: none;
        }

        .upper, .lower {
            font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            display: flex;
            z-index: 1;
        }

        .upper {
            flex-direction: column;
            justify-content: center;
            padding: 0 8.334vh;
            overflow: hidden;
            flex-grow: 1;
            width: 100%;
        }

        .lower {
            flex-direction: row;
            height: 29.26vh;
            padding-left: 8.334vh;
        }

        .background img {
            position: absolute;
            left: 50%;
            top: 50%;
            filter: blur(50px);
            opacity: 0.3;
            transform: translate(-50%, -50%);
        }

        .playing-track {
            display: flex;
            align-items: center;
            z-index: 1;
        }

        .playing-track img {
            margin-right: 8.334vh;
            height: 49vh;
            width: 49vh;
            box-shadow: 0 0 60px 0 rgba(0, 0, 0, 0.5);
        }

        .metadata {
            flex-grow: 1;
        }

        playback-progress-bar {
            margin: 4.167vh 0;
            height: 0.556vh;
            background: rgba(255, 255, 255, 0.2);
        }

        tv-track {
            --max-width: 18.889vh;
            margin-right: 4.815vh;
        }

        h1, h2, h3, h4, h5 {
            margin: 0;
            opacity: 0.9;
        }

        .upper h2 {
            font-size: 5.278vh;
            font-weight: normal;
            line-height: 7.407vh;
        }

        .upper h3 {
            font-size: 5.278vh;
            font-weight: 100;
            line-height: 7.407vh;
        }

        .upper h4 {
            font-size: 4.444vh;
            font-weight: normal;
            line-height: 5.185vh;
            margin-bottom: 0.741vh;
        }

        .upper h5 {
            font-size: 4.444vh;
            font-weight: 100;
            line-height: 5.185vh;
        }

        .no-tracks {
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            height: 100%;
            text-align: center;
        }

        .no-tracks .header {
            align-items: center;
            display: flex;
            flex-flow: row nowrap;
            justify-content: center;
            margin-bottom: 8vh;
        }

        .no-tracks .flash {
            font-size: 12vh;
        }

        .no-tracks svg {
            height: 16vh;
        }

        .no-tracks h1, .no-tracks h2 {
            font-weight: normal;
        }

        .no-tracks h1 {
            color: white;
            font-size: 7vh;
            margin-left: 32px;
        }

        .no-tracks h2 {
            font-size: 5.278vh;
        }
    </style>

    ${Body(props)}
`;
/* tslint:enable */

const artistNameSelector = artistJoinerFactory();

const restTracksSelector = createSelector(
    queueTracksSelector,
    (tracks: Track[]) => tracks.slice(1, 30),
);

const mapStateToProps = (state: State): ViewTvProps => {
    const currentTrackId = currentTrackIdSelector(state);
    return {
        currentTrackArtistName: currentTrackId
            ? artistNameSelector(state, currentTrackId)
            : null,
        currentTrackMetadata: currentTrackId
            ? singleMetadataSelector(state, currentTrackId)
            : null,
        domain: document.location.host,
        initError: state.party.partyLoadError,
        isLoading: state.party.partyLoadInProgress,
        metadata: state.metadata,
        party: state.party.currentParty,
        queueTracks: restTracksSelector(state),
    };
};

customElements.define(
    'view-tv',
    connect(
        mapStateToProps,
        {},
        ViewTv,
    ),
);
