import Snackbar from '@material-ui/core/es/Snackbar';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/es/styles';
import React, { useState } from 'react';
import { Provider as ReduxProvider, connect } from 'react-redux';

import { Views } from '../routing';
import { isPlaybackMasterSelector } from '../selectors/party';
import { State } from '../state';
import { store } from '../store';

import ViewHome from './ViewHome';

import styles from './App.module.scss';

interface AppShellProps {
  isPlaybackMaster: boolean;
  isToastOpen: boolean;
  toastText: string;
  view: Views;
}

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#951518',
    },
    secondary: {
      main: '#1c1f24',
    },
  },
  typography: {
    useNextVariants: true,
  },
});

const pageSelector = (view: Views) => {
  switch (view) {
    default:
    case Views.Home:
      return <ViewHome className={styles.viewHome} />;
    case Views.Party:
      return <p>Party-View</p>;
    case Views.Tv:
      return <p>TV-View</p>;
  }
};

const loadOnce = (when: boolean, url: string) => {
  return; // Although hooks are in the typings, we cannot use them atm

  const [hasLoaded, setHasLoaded] = useState(false);

  if (when && !hasLoaded) {
    setHasLoaded(true);

    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
  }
};

const AppShellComponent: React.FC<AppShellProps> = ({
  isPlaybackMaster,
  isToastOpen,
  toastText,
  view,
}) => {
  loadOnce(isPlaybackMaster, 'https://sdk.scdn.co/spotify-player.js');

  return (
    <div className={styles.appShell}>
      {pageSelector(view)}

      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={isToastOpen}
        ContentProps={{ 'aria-describedby': 'message-id' }}
        message={toastText}
      />
    </div>
  );
};

const mapStateToProps = (state: State): AppShellProps => ({
  isPlaybackMaster: isPlaybackMasterSelector(state),
  isToastOpen: !!state.appShell.currentToast,
  toastText: state.appShell.currentToast || '',
  view: (state.router!.result || { view: Views.Home }).view,
});
const AppShell = connect(mapStateToProps)(AppShellComponent);

export default () => (
  <ReduxProvider store={store}>
    <MuiThemeProvider theme={theme}>
      <AppShell />
    </MuiThemeProvider>
  </ReduxProvider>
);
