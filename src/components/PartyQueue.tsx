import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import {
  AutoSizer,
  InfiniteLoader,
  List,
  ListRowRenderer,
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import { Link } from 'redux-little-router';

import { isPartyOwnerSelector } from '../selectors/party';
import { settingsRouteSelector } from '../selectors/routes';
import { firebaseTrackIdSelector, queueTracksSelector } from '../selectors/track';
import { State, Track } from '../state';

import LoadingSpinner from './LoadingSpinner';
import styles from './PartyQueue.module.scss';
import PartyTrack from './PartyTrack';

interface PartyQueueProps {
  hasTracksLoaded: boolean;
  isOwner: boolean;
  settingsRoute: string;
  tracks: Track[];
}
interface PartyQueueOwnProps {
  className?: string;
}

type MergedProps = PartyQueueProps & PartyQueueOwnProps;

const rowHeight = ({ index }) => (index === 0) ? 80 : 64;

const Inner: React.FC<MergedProps> = ({
  hasTracksLoaded,
  isOwner,
  settingsRoute,
  tracks,
}) => {
  if (!hasTracksLoaded) {
    return <LoadingSpinner />;
  } else if (!tracks.length) {
    return (
      <>
        <h2 className={styles.queueEmpty}>
          🌝 The queue is empty!
        </h2>
        <h3 className={styles.queueEmpty}>
          {isOwner ? (
            <>
              <Link href={settingsRoute}>
                Go to settings
              </Link>
              &nbsp;
              to add a fallback playlist
            </>
          ) : (
            "Search for your favourite tracks and add them to the queue"
          )}
        </h3>
      </>
    );
  }

  const isRowLoaded = ({ index }) => index < tracks.length;
  const renderRow: ListRowRenderer = ({ index, key, style }) => (
    <PartyTrack
      key={key}
      style={style}
      trackId={firebaseTrackIdSelector(tracks[index].reference)}
    />
  );

  return (
    <InfiniteLoader
      isRowLoaded={isRowLoaded}
      loadMoreRows={() => Promise.resolve()}
      minimumBatchSize={20}
      rowCount={Infinity}
    >
      {({ onRowsRendered, registerChild }) => (
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              onRowsRendered={onRowsRendered}
              ref={registerChild}
              row
              rowCount={tracks.length}
              rowHeight={rowHeight}
              rowRenderer={renderRow}
            />
          )}
        </AutoSizer>
      )}
    </InfiniteLoader>
  );
};

const PartyQueue: React.FC<MergedProps> = (props) => (
  <main className={classNames(styles.partyQueue, props.className)}>
    <Inner {...props}/>
  </main>
);

const mapStateToProps = (state: State): PartyQueueProps => ({
  hasTracksLoaded: state.party.hasTracksLoaded,
  isOwner: isPartyOwnerSelector(state),
  settingsRoute: settingsRouteSelector(state)!,
  tracks: queueTracksSelector(state),
});

export default connect(mapStateToProps)(PartyQueue);
