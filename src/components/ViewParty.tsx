import AppBar from '@material-ui/core/es/AppBar';
import Button from '@material-ui/core/es/Button';
import Dialog from '@material-ui/core/es/Dialog';
import DialogActions from '@material-ui/core/es/DialogActions';
import DialogContent from '@material-ui/core/es/DialogContent';
import DialogTitle from '@material-ui/core/es/DialogTitle';
import Toolbar from '@material-ui/core/es/Toolbar';
import Typography from '@material-ui/core/es/Typography';
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

import { queueDragDrop, queueDragEnter, queueDragOver } from '../actions';
import { triggerOAuthLogin } from '../actions/auth';
import { changeDisplayLoginModal } from '../actions/view-party';
import { PartyViews } from '../routing';
import { EnabledProvidersList, Party, State } from '../state';

import PlaybackProgressBar from './PlaybackProgressBar';
import SearchBar from './SearchBar';
import {
  Facebook,
  Github,
  Google,
  Spotify,
  Twitter
} from './SocialIcons';
import styles from './ViewParty.module.scss';

interface PartyViewProps {
  displayLoginModal: boolean;
  enabledProviders: EnabledProvidersList;
  isFollowUpSignIn: boolean;
  party: Party | {
    created_by: string;
    name: string
  };
  view: PartyViews;
}
interface PartyViewDispatch {
  closeLoginModal: () => void;
  trackDragEnter;
  trackDragOver;
  trackDragDrop;
  triggerFacebookLogin: () => void;
  triggerGithubLogin: () => void;
  triggerGoogleLogin: () => void;
  triggerSpotifyLogin: () => void;
  triggerTwitterLogin: () => void;
}
interface PartyViewOwnProps {
  className?: string;
}

type MergedProps = PartyViewProps & PartyViewDispatch & PartyViewOwnProps;

interface InnerProps {
  view: PartyViews;
}

const Inner: React.FC<InnerProps> = ({ view }) => {
  switch (view) {
    default:
    case PartyViews.Queue:
      return <p>Queue View</p>;
    case PartyViews.Search:
      return <p>Search View</p>;
    case PartyViews.Settings:
      return <p>Settings View</p>;
    case PartyViews.Share:
      return <p>Share View</p>;
  }
};

// tslint:disable:max-line-length

const ViewParty: React.FC<MergedProps> = ({
  className,
  enabledProviders,
  isFollowUpSignIn,
  party,
  view,

  closeLoginModal,
  displayLoginModal,
  triggerFacebookLogin,
  triggerGithubLogin,
  triggerGoogleLogin,
  triggerSpotifyLogin,
  triggerTwitterLogin,
}) => (
  <div className={classNames(styles.viewParty, className)}>
    <AppBar className={styles.header} position="sticky">
      <Toolbar>
        <Typography
          className={styles.partyTitle}
          color="inherit"
          noWrap
          variant="h6"
        >
          {party.name}
        </Typography>
      </Toolbar>

      <Toolbar>
        <SearchBar className={styles.searchBar} />
      </Toolbar>

      <PlaybackProgressBar className={styles.progressBar} />
    </AppBar>

    <main>
      <Inner view={view}/>
    </main>

    <Dialog
      open={displayLoginModal}
      onClose={closeLoginModal}
    >
      <DialogTitle>
        {!isFollowUpSignIn
          ? "Please sign in to vote"
          : "Further action required"}
      </DialogTitle>

      <DialogContent>
        <p>
          {!isFollowUpSignIn
            ? "The party owner requires all guests to sign in to prevent cheating, but you wouldn't do that anyway, would ya? 😛"
            : "There already seems to be an account connected to that email. Please sign in with one of your previous social accounts. You will only need to do this once."}
        </p>

        <Button
          className={classNames(styles.login, styles.facebook)}
          onClick={triggerFacebookLogin}
          disabled={!enabledProviders.facebook}
          variant="contained"
        >
          <Facebook className={styles.loginIcon} />
          <span className={styles.loginCta}>Sign in with</span>
          &nbsp;Facebook
        </Button>
        <Button
          className={classNames(styles.login, styles.google)}
          onClick={triggerGoogleLogin}
          disabled={!enabledProviders.google}
          variant="contained"
        >
          <Google className={styles.loginIcon} />
          <span className={styles.loginCta}>Sign in with</span>
          &nbsp;Google
        </Button>
        <Button
          className={classNames(styles.login, styles.twitter)}
          onClick={triggerTwitterLogin}
          disabled={!enabledProviders.twitter}
          variant="contained"
        >
          <Twitter className={styles.loginIcon} />
          <span className={styles.loginCta}>Sign in with</span>
          &nbsp;Twitter
        </Button>
        <Button
          className={classNames(styles.login, styles.github)}
          onClick={triggerGithubLogin}
          disabled={!enabledProviders.github}
          variant="contained"
        >
          <Github className={styles.loginIcon} />
          <span className={styles.loginCta}>Sign in with</span>
          &nbsp;GitHub
        </Button>
        <Button
          className={classNames(styles.login, styles.spotify)}
          onClick={triggerSpotifyLogin}
          disabled={!enabledProviders.spotify}
          variant="contained"
        >
          <Spotify className={styles.loginIcon} />
          <span className={styles.loginCta}>Sign in with</span>
          &nbsp;Spotify
        </Button>
      </DialogContent>

      <DialogActions>
        <Button
          className={styles.cancel}
          onClick={closeLoginModal}
          variant="text"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  </div>
);

// tslint:enable

const allEnabled: EnabledProvidersList = {
  facebook: true,
  github: true,
  google: true,
  spotify: true,
  twitter: true,
};

const mapStateToProps = (state: State): PartyViewProps => ({
  displayLoginModal: state.partyView.loginModalOpen,
  enabledProviders: state.user.needsFollowUpSignInWithProviders
      ? state.user.needsFollowUpSignInWithProviders
      : allEnabled,
  isFollowUpSignIn: !!state.user.needsFollowUpSignInWithProviders,
  party: state.party.currentParty || { created_by: '', name: '' },
  view: (state.router.result || { subView: PartyViews.Queue }).subView,
});

const mapDispatchToProps: PartyViewDispatch = {
  closeLoginModal: () => changeDisplayLoginModal(false),
  trackDragEnter: queueDragEnter,
  trackDragOver: queueDragOver,
  trackDragDrop: queueDragDrop,
  triggerFacebookLogin: () => triggerOAuthLogin('facebook'),
  triggerGithubLogin: () => triggerOAuthLogin('github'),
  triggerGoogleLogin: () => triggerOAuthLogin('google'),
  triggerSpotifyLogin: () => triggerOAuthLogin('spotify'),
  triggerTwitterLogin: () => triggerOAuthLogin('twitter'),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ViewParty);
