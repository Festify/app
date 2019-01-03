import CircularProgress from '@material-ui/core/es/CircularProgress';
import Fab from '@material-ui/core/es/Fab';
import IconButton from '@material-ui/core/es/IconButton';
import Add from '@material-ui/icons/Add';
import Clear from '@material-ui/icons/Clear';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import Download from '@material-ui/icons/GetApp';
import Pause from '@material-ui/icons/Pause';
import PlayArrow from '@material-ui/icons/PlayArrow';
import SkipNext from '@material-ui/icons/SkipNext';
import classNames from 'classnames';
import React from 'react';
import connect from 'react-redux';
import { createSelector } from 'reselect';

import { installPlaybackMaster } from '../actions/party-data';
import { togglePlaybackStart } from '../actions/playback-spotify';
import { removeTrackAction, requestSetVoteAction as setVoteAction } from '../actions/queue';
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

import styles from './PartyTrack.module.scss';
import SrcSetImage from './SrcSetImage';

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
  className?: string;
  trackId: string;
}

type PartyTrackMergedProps = PartyTrackProps & PartyTrackOwnProps & PartyTrackDispatch;

const PlayButton: React.FC<PartyTrackMergedProps> = ({
  hasVoted,
  isMusicPlaying,
  isOwner,
  isPlayingTrack,
  metadata,
  togglingPlayback,
  track,

  removeTrack,
  setVote,
  togglePlayPause,
}) => {
  const voteBtnTitle =
    `${hasVoted ? "Unvote" : "Vote for"} ${metadata && metadata.name}`;

  if (isPlayingTrack) {
    return (
      <>
        {isOwner && track && (
          <IconButton
            className={styles.iconButton}
            onClick={() => removeTrack(track.reference)}
            title={`Skip ${metadata && metadata.name}`}
          >
            <SkipNext />
          </IconButton>
        )}

        <div className={styles.fabSpinner}>
          {togglingPlayback && (
            <CircularProgress
              className={styles.spinner}
              classes={{ root: styles.spinnerRoot }}
              thickness={2}
              variant="indeterminate"
            />
          )}

          <Fab
            className={styles.fab}
            classes={{ disabled: styles.fabDisabled }}
            color="primary"
            onClick={togglePlayPause}
            title={voteBtnTitle}
          >
            {isMusicPlaying ? <Pause /> : <PlayArrow />}
          </Fab>
        </div>
      </>
    );
  } else if (track) {
    const Icon = hasVoted
      ? Favorite
      : (track.vote_count > 0 || track.is_fallback)
        ? FavoriteBorder
        : Add;

    return (
      <IconButton
        className={styles.iconButton}
        onClick={() => setVote(track.reference, !hasVoted)}
        title={voteBtnTitle}
      >
        <Icon />
      </IconButton>
    );
  }

  return null;
};

const PartyTrack: React.FC<PartyTrackMergedProps> = (props) => {
  const {
    artistName,
    className,
    isPlayingTrack,
    metadata,
    showRemoveButton,
    showTakeoverButton,
    track,
    voteString,

    removeTrack,
    takeOverPlayback,
  } = props;

  return (
    <div
      className={classNames(
        styles.partyTrack,
        { [styles.partyTrackPlaying]: isPlayingTrack },
        className,
      )}
    >
      {metadata ? (
        <SrcSetImage
          className={classNames(
            styles.cover,
            { [styles.coverPlaying]: isPlayingTrack },
          )}
          images={metadata.cover}
          sizes="54px"
        />
      ) : (
        <div className={styles.cover} />
      )}

      <div
        className={classNames(
          styles.metadataWrapper,
          { [styles.metadataWrapperPlaying]: isPlayingTrack },
        )}
      >
        <h2 className={styles.songTitle}>
          {metadata ? metadata.name : "Loading..."}
        </h2>

        {artistName && (
          <aside className={styles.metadata}>
            <a>{artistName}</a>
            <span className={styles.dot}>&middot;</span>
            <span>{voteString}</span>
          </aside>
        )}
      </div>

      <div className={styles.iconWrapper}>
        {showTakeoverButton && (
          <IconButton
            className={styles.iconButton}
            onClick={takeOverPlayback}
            title="Transfer playback to current device"
          >
            <Download />
          </IconButton>
        )}
        {showRemoveButton && track && (
          <IconButton
            className={styles.iconButton}
            onClick={() => removeTrack(track.reference)}
            title={`Remove ${metadata && `${metadata.name} `}from queue`}
          >
            <Clear />
          </IconButton>
        )}

        <PlayButton {...props} />
      </div>
    </div>
  );
};

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
    (!isCompatible && hasOtherMaster || isCompatible) &&
    (!hasSptAccount && hasOtherMaster || hasSptAccount),
);

export const createMapStateToPropsFactory = (
  trackSelector: (state: State, trackId: string) => Track | null,
) => {
  const hasVotesOrIsFallbackSelector = createSelector(
    trackSelector,
    track => Boolean(track && (track.vote_count > 0 || track.is_fallback)),
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
        isPlaying &&
        isOwner &&
        !isMaster &&
        !!master &&
        isCompatible &&
        hasSptConnected,
    );
    const voteStringGenerator = voteStringGeneratorFactory(trackSelector);

    return (state: State, ownProps: PartyTrackOwnProps): PartyTrackProps => ({
      artistName: artistJoiner(state, ownProps.trackId),
      enablePlayButton: enablePlayButtonSelector(state),
      hasConnectedSpotifyAccount: hasConnectedSpotifyAccountSelector(state),
      hasVoted: !!state.party.userVotes &&
        state.party.userVotes[ownProps.trackId] === true,
      isOwner: isPartyOwnerSelector(state),
      isMusicPlaying: !!state.party.currentParty &&
        state.party.currentParty.playback.playing,
      isPlayingTrack: isPlayingSelector(state, ownProps.trackId),
      metadata: singleMetadataSelector(state, ownProps.trackId),
      showRemoveButton: showRemoveTrackButtonSelector(state, ownProps.trackId),
      showTakeoverButton: showTakeoverButtonSelector(state, ownProps.trackId),
      togglingPlayback: state.player.togglingPlayback,
      track: trackSelector(state, ownProps.trackId),
      voteString: voteStringGenerator(state, ownProps.trackId),
    });
  };
};

export const mapDispatchToProps: PartyTrackDispatch = {
  removeTrack: (ref: TrackReference) => removeTrackAction(ref, false),
  setVote: setVoteAction,
  takeOverPlayback: installPlaybackMaster,
  togglePlayPause: togglePlaybackStart,
};

export default connect(
  createMapStateToPropsFactory(singleTrackSelector),
  mapDispatchToProps,
)(PartyTrack);
