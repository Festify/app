import ArrowBack from '@material-ui/icons/ArrowBack';
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

import {
  changeTrackSearchInput,
  eraseTrackSearchInput,
} from '../actions/view-party';
import { State } from '../state';
import Logo from '../util/festify-logo';

import styles from './SearchBar.module.scss';

interface SearchBarProps {
  text: string;
}
interface SearchBarDispatch {
  onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
  onErase: () => void;
}
interface SearchBarOwnProps {
  className?: string;
}

type MergedProps = SearchBarProps & SearchBarDispatch & SearchBarOwnProps;

const SearchBar: React.FC<MergedProps> = (props) => (
  <div className={classNames(styles.searchBar, props.className)}>
    {props.text
      ? (
        <ArrowBack
          className={classNames(styles.icon, styles.buttonBack)}
          onClick={props.onErase}
        />
      ) : (
        <Logo className={styles.icon}/>
      )}

    <input
      className={styles.input}
      value={props.text}
      onChange={props.onChange}
      placeholder="Add Tracks"
    />
  </div>
);

const mapStateToProps = (state: State): SearchBarProps => ({
  text: state.router.query
    ? (state.router.query.s || '')
    : '',
});

const mapDispatchToProps: SearchBarDispatch = {
  onChange: (ev: React.ChangeEvent<HTMLInputElement>) =>
    changeTrackSearchInput(ev.target.value),
  onErase: eraseTrackSearchInput,
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
