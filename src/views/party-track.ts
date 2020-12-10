import '@polymer/paper-fab/paper-fab';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect, withFit } from 'fit-html';
import { html } from 'lit-html';
import { createSelector } from 'reselect';

import { installPlaybackMaster } from '../actions/party-data';
import { togglePlaybackStart } from '../actions/playback-spotify';
import { removeTrackAction, requestSetVoteAction as setVoteAction } from '../actions/queue';
import srcsetImg from '../components/srcset-img';
import {
    hasOtherPlaybackMasterSelector,
    isPartyOwnerSelector,
    isPlaybackMasterSelector,
    playbackMasterSelector,
} from '../selectors/party';
import {
    artistJoinerFactory,
    currentTrackSelector,
    singleMetadataSelector,
    singleTrackSelector,
    tracksEqual,
    voteStringGeneratorFactory,
} from '../selectors/track';
import { hasConnectedSpotifyAccountSelector } from '../selectors/users';
import { Metadata, State, Track, TrackReference } from '../state';
import sharedStyles from '../util/shared-styles';

interface PartyTrackProps {
    artistName: string | null;
    enablePlayButton: boolean;
    hasConnectedSpotifyAccount: boolean;
    hasVoted: boolean;
    isOwner: boolean;
    isMusicPlaying: boolean;
    isPlayingTrack: boolean;
    metadata: Metadata | null;
    showRemoveButton: boolean;
    showTakeoverButton: boolean;
    togglingPlayback: boolean;
    track: Track | null;
    voteString: string;
}

interface PartyTrackDispatch {
    removeTrack: (ref: TrackReference) => void;
    takeOverPlayback: () => void;
    togglePlayPause: () => void;
    setVote: (ref: TrackReference, vote: boolean) => void;
}

interface PartyTrackOwnProps {
    playing: boolean;
    trackid: string;
}

type PartyTrackRenderProps = PartyTrackProps & PartyTrackOwnProps & PartyTrackDispatch;

/* tslint:disable:max-line-length */
const LikeButtonIcon = (props: PartyTrackRenderProps): string => {
    if (!props.track) {
        return '';
    }

    if (props.hasVoted) {
        return 'festify:favorite';
    } else if (props.track.vote_count > 0 || props.track.is_fallback) {
        return 'festify:favorite-border';
    } else {
        return 'festify:add';
    }
};

const PlayButton = (props: PartyTrackRenderProps) => {
    if (props.isPlayingTrack) {
        return html`
            ${props.isOwner && props.track
                ? html`
                      <paper-icon-button
                          icon="festify:skip-next"
                          @click=${() => props.removeTrack(props.track!.reference)}
                          title="Skip ${props.metadata ? props.metadata.name : 'Loading...'}"
                      >
                      </paper-icon-button>
                  `
                : null}
            <div class="fab-spinner">
                <paper-spinner-lite .active=${props.togglingPlayback}></paper-spinner-lite>
                <paper-fab
                    mini
                    icon=${props.isMusicPlaying ? 'festify:pause' : 'festify:play-arrow'}
                    @click=${props.togglePlayPause}
                    .disabled=${!props.enablePlayButton}
                >
                </paper-fab>
            </div>
        `;
    } else {
        return props.track
            ? html`
                  <paper-icon-button
                      icon="${LikeButtonIcon(props)}"
                      @click=${() => props.setVote(props.track!.reference, !props.hasVoted)}
                      title="${(props.hasVoted ? 'Unvote ' : 'Vote for ') +
                          (props.metadata ? props.metadata.name : 'Loading...')}"
                  >
                  </paper-icon-button>
              `
            : null;
    }
};

export const PartyTrack = (props: PartyTrackRenderProps) => html`
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

        img,
        .empty {
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

        paper-fab[disabled] {
            opacity: 0.7;
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

    ${props.metadata
        ? srcsetImg(props.metadata.cover, '54px')
        : html`
              <div class="empty"></div>
          `}
    <div class="metadata-wrapper">
        <h2>${props.metadata ? props.metadata.name : 'Loading...'}</h2>
        ${props.artistName
            ? html`
                  <aside>
                      <a>${props.artistName}</a>
                      <span class="dot">&middot;</span>
                      <span>${props.voteString}</span>
                  </aside>
              `
            : null}
    </div>

    <div class="icon-wrapper">
        ${props.showTakeoverButton
            ? html`
                  <paper-icon-button
                      icon="festify:download"
                      @click=${props.takeOverPlayback}
                      title="Transfer playback to current device"
                  >
                  </paper-icon-button>
              `
            : null}
        ${props.showRemoveButton
            ? html`
                  <paper-icon-button
                      icon="festify:clear"
                      @click=${() => props.removeTrack(props.track!.reference)}
                      title="Remove ${props.metadata
                          ? props.metadata.name
                          : 'Loading...'} from queue"
                  >
                  </paper-icon-button>
              `
            : null}
        ${PlayButton(props)}
    </div>
`;
/* tslint:enable */

const isCompatibleSelector = (s: State) => s.player.isCompatible;

/**
 * Computes whether the play fab is enabled.
 *
 * Enable it when
 * 1. we're Party Owner AND
 * 2. we're not toggling the playback right now AND
 * 3. we're either on a compatible device, or we're just controlling some other device AND
 * 4. we either have a Spotify account connected, or we're just controlling some other device.
 */
const enablePlayButtonSelector = createSelector(
    isPartyOwnerSelector,
    (s: State) => s.player.togglingPlayback,
    isCompatibleSelector,
    hasConnectedSpotifyAccountSelector,
    hasOtherPlaybackMasterSelector,
    (isOwner, isToggling, isCompatible, hasSptAccount, hasOtherMaster) =>
        isOwner &&
        !isToggling &&
        ((!isCompatible && hasOtherMaster) || isCompatible) &&
        ((!hasSptAccount && hasOtherMaster) || hasSptAccount),
);

export const createMapStateToPropsFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => {
    const hasVotesOrIsFallbackSelector = createSelector(trackSelector, track =>
        Boolean(track && (track.vote_count > 0 || track.is_fallback)),
    );

    /*
     * Since the selectors use component props, one for each instance must be created.
     */
    return () => {
        const artistJoiner = artistJoinerFactory();
        const isPlayingSelector = createSelector(
            currentTrackSelector,
            trackSelector,
            (currentTrack, track) => tracksEqual(currentTrack, track),
        );
        const showRemoveTrackButtonSelector = createSelector(
            isPartyOwnerSelector,
            hasVotesOrIsFallbackSelector,
            isPlayingSelector,
            (isOwner, hasVotesOrIsFallback, isPlaying) =>
                isOwner && hasVotesOrIsFallback && !isPlaying,
        );
        const showTakeoverButtonSelector = createSelector(
            isPartyOwnerSelector,
            isPlaybackMasterSelector,
            playbackMasterSelector,
            isPlayingSelector,
            isCompatibleSelector,
            hasConnectedSpotifyAccountSelector,
            (isOwner, isMaster, master, isPlaying, isCompatible, hasSptConnected) =>
                isPlaying && isOwner && !isMaster && !!master && isCompatible && hasSptConnected,
        );
        const voteStringGenerator = voteStringGeneratorFactory(trackSelector);

        return (state: State, ownProps: PartyTrackOwnProps): PartyTrackProps => ({
            artistName: artistJoiner(state, ownProps.trackid),
            enablePlayButton: enablePlayButtonSelector(state),
            hasConnectedSpotifyAccount: hasConnectedSpotifyAccountSelector(state),
            hasVoted: !!state.party.userVotes && state.party.userVotes[ownProps.trackid] === true,
            isOwner: isPartyOwnerSelector(state),
            isMusicPlaying: !!state.party.currentParty && state.party.currentParty.playback.playing,
            isPlayingTrack: isPlayingSelector(state, ownProps.trackid),
            metadata: singleMetadataSelector(state, ownProps.trackid),
            showRemoveButton: showRemoveTrackButtonSelector(state, ownProps.trackid),
            showTakeoverButton: showTakeoverButtonSelector(state, ownProps.trackid),
            togglingPlayback: state.player.togglingPlayback,
            track: trackSelector(state, ownProps.trackid),
            voteString: voteStringGenerator(state, ownProps.trackid),
        });
    };
};

export const mapDispatchToProps: PartyTrackDispatch = {
    removeTrack: (ref: TrackReference) => removeTrackAction(ref, false),
    setVote: setVoteAction,
    takeOverPlayback: installPlaybackMaster,
    togglePlayPause: togglePlaybackStart,
};

export const PartyTrackElementBase = withFit<PartyTrackOwnProps, PartyTrackRenderProps>(
    PartyTrack,
    {
        playing: Boolean,
        trackid: String,
    },
)(HTMLElement);

const PartyTrackElement = connect(
    createMapStateToPropsFactory(singleTrackSelector),
    mapDispatchToProps,
)(PartyTrackElementBase);

customElements.define('party-track', PartyTrackElement);
