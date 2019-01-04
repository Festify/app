import classNames from 'classnames';
import React, { CSSProperties } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { playbackSelector } from '../selectors/party';
import { currentTrackIdSelector, metadataSelector } from '../selectors/track';
import { Metadata, Playback, State } from '../state';

import styles from './PlaybackProgressBar.module.scss';

interface ProgressBarProps {
  className?: string;
  durationMs: number;
  playback: Playback | null;
}
interface ProgressBarState {
  indicatorStyle: CSSProperties;
}

class PlaybackProgressBar extends React.Component<
  ProgressBarProps,
  ProgressBarState
> {
  state = { indicatorStyle: {} };

  componentDidMount() {
    this.updateBarPosition();
  }

  componentWillReceiveProps() {
    this.updateBarPosition();
  }

  render() {
    return (
      <div className={classNames(styles.progressBar, this.props.className)}>
        <div className={styles.indicator} style={this.state.indicatorStyle} />
      </div>
    );
  }

  private transitionTo(
    percentage: number,
    durationMs: number,
    isPlaying: boolean,
  ) {
    const indicatorStyle: CSSProperties = {
      transition: `opacity 0.25s ease, transform ${durationMs}ms linear`,
      opacity: isPlaying ? 1 : 0.5,
      transform: `scaleX(${percentage / 100})`,
    };

    this.setState({ indicatorStyle });
  }

  private updateBarPosition() {
    const { durationMs, playback } = this.props;
    if (!playback || durationMs <= 0) {
      this.transitionTo(0, 0, false);
      return;
    }

    const { last_change, last_position_ms, playing } = playback;

    let currentPercentage = last_position_ms / durationMs;
    if (playing) {
      const timeDiff = Date.now() - last_change;
      currentPercentage += (timeDiff / durationMs);
    }

    window.requestAnimationFrame(() => {
      this.transitionTo(currentPercentage * 100, 0, playing);

      if (playing) {
        // Give the compositor a chance to reset the transitions
        // before we start the actual animation.
        window.requestAnimationFrame(() => {
          const remainingDurationMs = durationMs * (1 - currentPercentage);
          this.transitionTo(100, remainingDurationMs, playing);
        });
      }
    });
  }
}

const currentDurationSelector = createSelector(
  metadataSelector,
  currentTrackIdSelector,
  (metadata: Record<string, Metadata>, trackId: string | null) =>
      trackId && trackId in metadata
          ? metadata[trackId].durationMs
          : 0,
);

const mapDispatchToProps = (state: State): ProgressBarProps => ({
  durationMs: currentDurationSelector(state),
  playback: playbackSelector(state),
});

export default connect(mapDispatchToProps)(PlaybackProgressBar);
