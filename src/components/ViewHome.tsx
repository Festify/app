import Button, { ButtonProps } from '@material-ui/core/es/Button';
import TextField from '@material-ui/core/es/TextField';
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Actions } from '../actions';
import { triggerOAuthLogin } from '../actions/auth';
import { createPartyStart, joinPartyStart as joinParty } from '../actions/party-data';
import { changePartyId } from '../actions/view-home';
import { State } from '../state';
import Logo from '../util/festify-logo';

import styles from './ViewHome.module.scss';

interface HomeViewProps {
  authorizationInProgress: boolean;
  authorizedAndPremium: boolean;
  authStatusKnown: boolean;
  partyCreationInProgress: boolean;
  partyCreationError: Error | null;
  partyId: string;
  partyIdValid: boolean;
  partyJoinError: Error | null;
  partyJoinInProgress: boolean;
  playerCompatible: boolean;
}
interface HomeViewDispatch {
  createParty: () => void;
  loginWithSpotify: () => void;
  joinParty: () => void;
  partyIdInputChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
  partyIdInputKeyPress: (ev: React.KeyboardEvent) => void;
}
interface HomeViewOwnProps {
  className: string;
}
type HomeViewMergedProps = HomeViewProps & HomeViewDispatch & HomeViewOwnProps;

const HomeButton: React.FC<ButtonProps> = ({ children, ...restProps }) => (
  <Button
    className={styles.button}
    color="primary"
    variant="contained"
    {...restProps}
  >
    {children}
  </Button>
);

const DynamicButton = (viewProps: HomeViewMergedProps) => {
  if (!viewProps.playerCompatible) {
    return null;
  }

  if (viewProps.partyCreationInProgress) {
    return <HomeButton disabled>Creating...</HomeButton>;
  } else if (viewProps.authorizedAndPremium) {
    return (
      <HomeButton onClick={viewProps.createParty}>
        Create Party
      </HomeButton>
    );
  } else if (viewProps.authorizationInProgress || !viewProps.authStatusKnown) {
    return <HomeButton disabled>Authorizing...</HomeButton>;
  } else {
    return (
      <HomeButton onClick={viewProps.loginWithSpotify}>
        Login to create Party
      </HomeButton>
    );
  }
};

const HomeViewComponent: React.FC<HomeViewMergedProps> = (props) => (
  <div className={classNames(styles.viewHome, props.className)}>
    <header>
      <Logo className={styles.logo} />
    </header>

    <p className={styles.intro}>
      Festify lets your guests choose which music should be played
      using their smartphones.
    </p>

    <main className={styles.form}>
      <TextField
        className={styles.input}
        label="Party Code"
        type="tel"
        onChange={props.partyIdInputChange}
        onKeyPress={props.partyIdInputKeyPress}
        value={props.partyId}
      />

      <HomeButton
        disabled={!props.partyIdValid}
        onClick={props.joinParty}
      >
        {props.partyJoinInProgress ? "Joining..." : "Join Party"}
      </HomeButton>

      {DynamicButton(props)}
    </main>
  </div>
);

const mapStateToProps = (state: State): HomeViewProps => ({
  ...state.homeView,
  authorizationInProgress: state.user.credentials.spotify.authorizing,
  authorizedAndPremium: Boolean(
    state.user.credentials.spotify.user &&
    state.user.credentials.spotify.user.product === 'premium',
  ),
  authStatusKnown: state.user.credentials.spotify.statusKnown,
  playerCompatible: state.player.isCompatible,
});

const mapDispatchToProps = (dispatch: Dispatch<Actions>) => ({
  createParty: () => dispatch(createPartyStart()),
  joinParty: () => dispatch(joinParty()),
  loginWithSpotify: () => dispatch(triggerOAuthLogin('spotify')),
  partyIdInputChange: (ev: React.ChangeEvent<HTMLInputElement>) => dispatch(changePartyId(ev.target.value)),
  partyIdInputKeyPress: (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter') {
      dispatch(joinParty());
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeViewComponent);
