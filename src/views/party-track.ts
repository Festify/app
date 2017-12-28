import '@polymer/iron-icons/av-icons';
import '@polymer/iron-icons/iron-icons';
import '@polymer/paper-fab/paper-fab';
import { connect, html, withExtended, withProps } from 'fit-html';
import { TemplateResult } from 'lit-html';
import { createSelector } from 'reselect';

import { toggleVote } from '../actions/view-party';
import srcsetImg from '../components/srcset-img';
import { Metadata, Reference, State, Track } from '../state';
import sharedStyles from '../util/shared-styles';

export interface PartyTrackProps {
    artistName: string;
    canTogglePlayPause: boolean;
    isMusicPlaying: boolean;
    isPlayingTrack: boolean;
    hasVoted: boolean;
    metadata: Metadata;
    track: Track;
    voteString: string;
}

interface PartyTrackDispatch {
    togglePlayPause: () => void;
    toggleVote: (ref: Reference) => void;
}

interface PartyTrackOwnProps {
    playing: boolean;
    trackid: string;
}

const LikeButtonIcon = (props: PartyTrackProps): string => {
    if (props.hasVoted) {
        return 'favorite';
    } else if (props.track.vote_count > 0 || props.track.is_fallback) {
        return 'favorite-border';
    } else {
        return 'add';
    }
};

const ActionButton = (props: PartyTrackProps & PartyTrackDispatch): TemplateResult => {
    if (props.isPlayingTrack) {
        return html`
            <paper-fab mini
                       icon="${props.isMusicPlaying ? 'av:pause' : 'av:play-arrow'}"
                       on-click="${props.togglePlayPause}"
                       disabled$="${!props.canTogglePlayPause}">
            </paper-fab>
        `;
    } else {
        return html`
            <paper-icon-button icon="${LikeButtonIcon(props)}"
                               on-click="${ev => props.toggleVote(props.track.reference)}">
            </paper-icon-button>
        `;
    }
};

/* tslint:disable:max-line-length */
export const PartyTrack = (props: PartyTrackProps & PartyTrackDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            box-sizing: content-box;
            padding: 5px 16px;
            display: flex;
            align-items: center;
            flex-direction: row;
        }

        :host([playing]) {
            background-color: #22262b;
            padding: 13px 16px;
        }

        :host([playing]) + :host {
            padding-top: 13px;
        }

        :host([playing]) img {
            box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.5);
        }

        :host([playing]) .metadata-wrapper {
            margin-right: 20px;
        }

        img {
            background: rgba(0, 0, 0, 0.2);
            flex-shrink: 0;
            height: 54px;
            margin-right: 15px;
            width: 54px;
        }

        .metadata-wrapper {
            margin-top: 2px;
            overflow: hidden;
        }

        h2 {
            margin: 0;
            font-weight: lighter;
            font-size: 15px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        aside {
            margin: 2px 0;
            font-weight: 300;
            font-size: 13px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .dot {
            margin: 0 4px;
        }

        .icon-wrapper {
            margin-left: auto;
            flex-basis: 40px;
        }

        paper-fab {
            color: white;
            background-color: var(--primary-color);
        }

        paper-icon-button {
            margin-left: 5px;
            padding: 6px;
        }
    </style>

    ${srcsetImg(props.metadata.cover, '54px')}
    <div class="metadata-wrapper">
        <h2>${props.metadata.name}</h2>
        ${props.artistName
            ? html`
                <aside>
                    <a>${props.artistName}</a>
                    <span class="dot">&middot;</span>
                    <span>${props.voteString}</span>
                </aside>
            `
            : html``
        }
    </div>

    <div class="icon-wrapper">
        ${ActionButton(props)}
    </div>
`;
/* tslint:enable */

const dummyMetadata: Metadata = {
    artists: [],
    cover: [],
    name: 'Loading...',
};
const dummyTrack: Track = {
    added_at: 0,
    is_fallback: false,
    order: 0,
    reference: {
        id: '',
        provider: 'spotify',
    },
    vote_count: 0,
};

const metadataSelector = (state: State, trackId: string) => state.metadata[trackId];
const trackSelector = (state: State, trackId: string) => state.party.tracks && state.party.tracks[trackId];

export const createMapStateToPropsFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => {
    /*
     * Since the selectors use component props, one for each instance must be created.
     */
    return () => {
        const defaultMetaSelector = createSelector(
            metadataSelector,
            metadata => ({ ...dummyMetadata, ...metadata }),
        );

        const defaultTrackSelector = createSelector(
            trackSelector,
            track => ({ ...dummyTrack, ...track }),
        );

        const artistsSelector = createSelector(defaultMetaSelector, metadata => metadata.artists);
        const artistJoiner = createSelector(
            artistsSelector,
            artists => artists.join(' & '),
        );

        const voteStringGenerator = createSelector(
            defaultTrackSelector,
            ({ is_fallback, vote_count }) => {
                if (vote_count > 1) {
                    return `${vote_count} Votes`;
                } else if (vote_count === 1) {
                    return "One Vote";
                } else {
                    return is_fallback ? "Fallback Track" : "Not in Queue";
                }
            },
        );

        return (state: State, ownProps: PartyTrackOwnProps): PartyTrackProps => {
            const metadata = defaultMetaSelector(state, ownProps.trackid);
            const track = defaultTrackSelector(state, ownProps.trackid);
            return {
                metadata,
                track,
                artistName: artistJoiner(state, ownProps.trackid),
                canTogglePlayPause: false,
                hasVoted: !!state.party.userVotes && state.party.userVotes[ownProps.trackid] === true,
                isMusicPlaying: false,
                isPlayingTrack: ownProps.playing,
                voteString: voteStringGenerator(state, ownProps.trackid),
            };
        };
    };
};

export const mapDispatchToProps: PartyTrackDispatch = {
    toggleVote,
    togglePlayPause: () => {},
};

const PartyTrackBase = withProps(withExtended(connect(
    createMapStateToPropsFactory(trackSelector),
    mapDispatchToProps,
    PartyTrack,
)), {
    playing: Boolean,
    trackid: String,
});

class PartyTrackComponent extends PartyTrackBase {
    constructor() {
        super();

        const playingProp = Object.getOwnPropertyDescriptor(this, 'playing')!;
        Object.defineProperty(this, 'playing', {
            get: () => playingProp.get!.call(this),
            set: (val: boolean) => {
                if (val) {
                    if (!this.hasAttribute('playing')) {
                        this.setAttribute('playing', '');
                    }
                } else {
                    if (this.hasAttribute('playing')) {
                        this.removeAttribute('playing');
                    }
                }

                playingProp.set!.call(this, val);
            },
        });
    }
}

customElements.define(
    'party-track',
    PartyTrackComponent,
);
