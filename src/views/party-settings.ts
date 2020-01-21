import '@polymer/paper-button/paper-button';
import '@polymer/paper-checkbox/paper-checkbox';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-input/paper-input';
import '@polymer/paper-spinner/paper-spinner-lite';
import { connect } from 'fit-html';
import { html } from 'lit-html';

import { triggerOAuthLogin } from '../actions/auth';
import {
    changePartyName,
    changePartySetting,
    changeSearchInput,
    flushQueueStart,
    insertPlaylistStart,
} from '../actions/view-party-settings';
import { filteredPlaylistsSelector } from '../selectors/playlists';
import { hasConnectedSpotifyAccountSelector } from '../selectors/users';
import { PartySettings, Playlist, State } from '../state';
import sharedStyles from '../util/shared-styles';

interface PartySettingsProps {
    isAuthorizing: boolean;
    isPlaylistLoadInProgress: boolean;
    isSpotifyConnected: boolean;
    partyName: string;
    playlists: Playlist[];
    playlistSearch: string;
    queueFlushInProgress: boolean;
    settings: PartySettings;
    tracksLoadInProgress: boolean;
    tracksToLoad: number;
    tracksLoaded: number;
}

interface PartySettingsDispatch {
    changePartyName: (newName: string) => void;
    changePartySetting: <K extends keyof PartySettings>(setting: K, val: PartySettings[K]) => void;
    changeSearchInput: (newContent: string) => void;
    flushTracks: () => void;
    insert: (playlist: Playlist, shuffle: boolean) => void;
    triggerSpotifyLogin: () => void;
}

const LoginView = (props: PartySettingsProps & PartySettingsDispatch) => html`
    <h3>Sign in to set the Fallback Playlist</h3>

    ${props.isAuthorizing
        ? html`
            <paper-spinner-lite active alt="Authorizing...">
            </paper-spinner-light>
        `
        : html`
              <paper-button raised class="login spotify" @click=${props.triggerSpotifyLogin}>
                  <iron-icon icon="social:spotify"></iron-icon>
                  <span>Sign in with</span>
                  Spotify
              </paper-button>
          `}
`;

const PlaylistView = (props: PartySettingsProps & PartySettingsDispatch) => html`
    <h3>Fallback Playlist</h3>

    <paper-input
        label="Search your playlists"
        .value=${props.playlistSearch}
        type="text"
        @input=${ev => props.changeSearchInput((ev.target as HTMLInputElement).value)}
    >
    </paper-input>

    ${props.isPlaylistLoadInProgress
        ? html`
            <paper-spinner-lite active alt="Loading playlists...">
            </paper-spinner-light>
        `
        : null}
    ${props.playlists.map(
        item => html`
            <div class="fallback-playlist">
                <h4>${item.name}</h4>

                <paper-icon-button
                    class="shuffle-button"
                    icon="festify:shuffle"
                    @click=${() => props.insert(item, true)}
                    title="Insert shuffled"
                    .disabled=${props.tracksLoadInProgress}
                >
                </paper-icon-button>
                <paper-icon-button
                    icon="festify:add"
                    @click=${() => props.insert(item, false)}
                    title="Insert"
                    .disabled=${props.tracksLoadInProgress}
                >
                </paper-icon-button>
            </div>
        `,
    )}
`;

/* tslint:disable:max-line-length */
const SettingsView = (props: PartySettingsProps & PartySettingsDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .upper,
        .lower {
            padding: 10px 20px;
        }

        h3 {
            border-bottom: 1px solid #333;
            margin-bottom: 0;
        }

        .upper > :not(h3) {
            margin-bottom: 16px;
        }

        paper-spinner-lite {
            display: block;
            margin: 16px auto 16px auto;

            --paper-spinner-color: var(--primary-color);
        }

        paper-checkbox {
            display: block;
        }

        paper-button.login {
            margin-top: 1em;
        }

        .fallback-playlist {
            cursor: pointer;
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-top: 4px;
            margin-bottom: 4px;
            position: relative;
        }

        .fallback-playlist[active] {
            background: rgba(255, 255, 255, 0.15);
        }

        .fallback-playlist:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .fallback-playlist h4 {
            font-weight: normal;
            margin: 0 20px 0 12px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .fallback-playlist paper-icon-button {
            flex-shrink: 0;
        }

        .fallback-playlist .shuffle-button {
            margin-left: auto;
        }

        @media (min-width: 1024px) {
            :host {
                flex-direction: row;
            }

            .upper,
            .lower {
                width: 50%;
            }
        }
    </style>

    <div class="upper">
        <h3>General Settings</h3>
        <paper-input
            label="Party Name"
            .value=${props.partyName}
            title="Change the name of your party"
            type="text"
            @input=${ev => props.changePartyName((ev.target as HTMLInputElement).value)}
        >
        </paper-input>

        <paper-input
            label="Maximum Track Length (minutes)"
            .value=${props.settings.maximum_track_length}
            title="Change the maximum track length in minutes that can be added to the queue."
            type="number"
            min="1"
            prevent-invalid-input
            @input=${ev =>
                props.changePartySetting(
                    'maximum_track_length',
                    parseInt((ev.target as HTMLInputElement).value) || null,
                )}
        >
        </paper-input>

        <paper-input
            label="TV Mode Text"
            .value=${props.settings.tv_mode_text}
            title="Choose the text you want to show in TV Mode below the progress bar."
            type="text"
            @input=${ev =>
                props.changePartySetting('tv_mode_text', (ev.target as HTMLInputElement).value)}
        >
        </paper-input>

        <paper-checkbox
            .checked=${!props.settings.allow_multi_track_add}
            @checked-changed=${ev =>
                props.changePartySetting(
                    'allow_multi_track_add',
                    !(ev.target as HTMLInputElement).checked,
                )}
            title="To avoid spam, you might want to prevent your users from adding lots of tracks quickly from the search menu."
        >
            Close search after a track has been added
        </paper-checkbox>

        <paper-checkbox
            .checked=${props.settings.allow_explicit_tracks}
            @checked-changed=${ev =>
                props.changePartySetting(
                    'allow_explicit_tracks',
                    (ev.target as HTMLInputElement).checked,
                )}
            title="If you are prude, you can disable adding explict tracks here. Be aware, though, that Spotify does not provide 100% reliable information about whether a track is explicit or not, so there might be 'false negatives'."
        >
            Allow guests to add explict tracks
        </paper-checkbox>

        <paper-checkbox
            .checked=${!props.settings.allow_anonymous_voters}
            @checked-changed=${ev =>
                props.changePartySetting(
                    'allow_anonymous_voters',
                    !(ev.target as HTMLInputElement).checked,
                )}
            title="Prevent vote cheating by requiring guests to sign-in with a social account such as Facebook or Google."
        >
            Require guests to sign in before voting
        </paper-checkbox>

        <paper-button
            raised
            @click=${props.flushTracks}
            title="Remove all but the playing track from the queue to start over"
            .disabled=${props.queueFlushInProgress}
        >
            Flush queue
        </paper-button>
    </div>

    <div class="lower">
        ${props.isSpotifyConnected ? PlaylistView(props) : LoginView(props)}
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartySettingsProps => ({
    isAuthorizing: state.user.credentials.spotify.authorizing,
    isPlaylistLoadInProgress: state.settingsView.playlistLoadInProgress,
    isSpotifyConnected: hasConnectedSpotifyAccountSelector(state),
    partyName: (state.party.currentParty || { name: '' }).name,
    playlists: filteredPlaylistsSelector(state),
    playlistSearch: state.settingsView.playlistSearchQuery,
    queueFlushInProgress: state.settingsView.queueFlushInProgress,
    settings: PartySettings.defaultSettings(
        state.party.currentParty && state.party.currentParty.settings,
    ),
    tracksLoadInProgress: state.settingsView.tracksLoadInProgress,
    tracksLoaded: state.settingsView.tracksLoaded,
    tracksToLoad: state.settingsView.tracksToLoad,
});

const mapDispatchToProps: PartySettingsDispatch = {
    changePartyName,
    changePartySetting,
    changeSearchInput,
    flushTracks: flushQueueStart,
    insert: insertPlaylistStart,
    triggerSpotifyLogin: () => triggerOAuthLogin('spotify'),
};

customElements.define('party-settings', connect(mapStateToProps, mapDispatchToProps)(SettingsView));
