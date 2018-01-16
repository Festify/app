import '@polymer/paper-fab/paper-fab';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect, html, withExtended, withProps } from 'fit-html';

import { togglePlayPause } from '../actions/playback-spotify';
import { removeTrack, toggleVote } from '../actions/queue';
import srcsetImg from '../components/srcset-img';
import { isPartyOwnerSelector } from '../selectors/party';
import {
    artistJoinerFactory,
    defaultMetaSelectorFactory,
    defaultTrackSelectorFactory,
    singleTrackSelector,
    voteStringGeneratorFactory,
} from '../selectors/track';
import { Metadata, State, Track, TrackReference } from '../state';
import sharedStyles from '../util/shared-styles';

export interface PartyTrackProps {
    artistName: string;
    isOwner: boolean;
    isMusicPlaying: boolean;
    isPlayingTrack: boolean;
    hasVoted: boolean;
    metadata: Metadata;
    track: Track;
    voteString: string;
    togglingPlayback: boolean;
}

interface PartyTrackDispatch {
    removeTrack: (ref: TrackReference) => void;
    togglePlayPause: () => void;
    toggleVote: (ref: TrackReference) => void;
}

interface PartyTrackOwnProps {
    playing: boolean;
    trackid: string;
}

const LikeButtonIcon = (props: PartyTrackProps): string => {
    if (props.hasVoted) {
        return 'festify:favorite';
    } else if (props.track.vote_count > 0 || props.track.is_fallback) {
        return 'festify:favorite-border';
    } else {
        return 'festify:add';
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
            display: flex;
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

        .fab-spinner {
            margin-left: 5px;
            position: relative;
        }

        .fab-spinner paper-spinner-lite {
            --paper-spinner-stroke-width: 2px;
            --offset: calc(-1 * var(--paper-spinner-stroke-width));
            --size: calc(40px + 2 * var(--paper-spinner-stroke-width));

            position: absolute;
            top: var(--offset);
            left: var(--offset);
            width: var(--size);
            height: var(--size);
            --paper-spinner-color: white;
            pointer-events: none;
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
            : null
        }
    </div>

    <div class="icon-wrapper">
        ${props.isOwner && !props.isPlayingTrack && (props.track.vote_count > 0 || props.track.is_fallback)
            ? html`
                <paper-icon-button icon="festify:clear"
                                   on-click="${() => props.removeTrack(props.track.reference)}"
                                   title="Remove ${props.metadata.name} from queue">
                </paper-icon-button>
            `
            : null}
        ${props.isPlayingTrack
            ? html`
                ${props.isOwner
                    ? html`
                        <paper-icon-button icon="festify:skip-next"
                                           on-click="${() => props.removeTrack(props.track.reference)}"
                                           title="Skip ${props.metadata.name}">
                        </paper-icon-button>
                    `
                    : null}
                <div class="fab-spinner">
                    <paper-spinner-lite active="${props.togglingPlayback}"></paper-spinner-lite>
                    <paper-fab mini
                               icon="${props.isMusicPlaying ? 'festify:pause' : 'festify:play-arrow'}"
                               on-click="${props.togglePlayPause}"
                               disabled="${!props.isOwner || props.togglingPlayback}">
                    </paper-fab>
                </div>
            `
            : html`
                <paper-icon-button icon="${LikeButtonIcon(props)}"
                                   on-click="${ev => props.toggleVote(props.track.reference)}"
                                   title="${(props.hasVoted ? "Unvote " : "Vote for ") + props.metadata.name}">
                </paper-icon-button>
            `
        }
    </div>
`;
/* tslint:enable */

export const createMapStateToPropsFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => {
    /*
     * Since the selectors use component props, one for each instance must be created.
     */
    return () => {
        const defaultMetaSelector = defaultMetaSelectorFactory();
        const defaultTrackSelector = defaultTrackSelectorFactory(trackSelector);
        const artistJoiner = artistJoinerFactory();
        const voteStringGenerator = voteStringGeneratorFactory(defaultTrackSelector);

        return (state: State, ownProps: PartyTrackOwnProps): PartyTrackProps => {
            const metadata = defaultMetaSelector(state, ownProps.trackid);
            const track = defaultTrackSelector(state, ownProps.trackid);
            return {
                metadata,
                track,
                artistName: artistJoiner(state, ownProps.trackid),
                isOwner: isPartyOwnerSelector(state),
                hasVoted: !!state.party.userVotes && state.party.userVotes[ownProps.trackid] === true,
                isMusicPlaying: !!state.party.currentParty && state.party.currentParty.playback.playing,
                isPlayingTrack: ownProps.playing,
                voteString: voteStringGenerator(state, ownProps.trackid),
                togglingPlayback: state.player.togglingPlayback,
            };
        };
    };
};

export const mapDispatchToProps: PartyTrackDispatch = {
    removeTrack: (ref: TrackReference) => removeTrack(ref, false),
    toggleVote,
    togglePlayPause,
};

const PartyTrackBase = withProps(withExtended(connect(
    createMapStateToPropsFactory(singleTrackSelector),
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
