import '@polymer/paper-button/paper-button';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-input/paper-input';
import '@polymer/paper-spinner/paper-spinner-lite';
import { connect } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';

import { changePartyName, changeSearchInput, insertPlaylist } from '../actions/party-settings';
import { flushTracks } from '../actions/queue';
import { filteredPlaylistsSelector } from '../selectors/playlists';
import { Playlist, State } from '../state';
import sharedStyles from '../util/shared-styles';

interface PartySettingsProps {
    isPlaylistLoadInProgress: boolean;
    partyName: string;
    playlists: Playlist[];
    playlistSearch: string;
    tracksLoadInProgress: boolean;
    tracksToLoad: number;
    tracksLoaded: number;
}

interface PartySettingsDispatch {
    changePartyName: (newName: string) => void;
    changeSearchInput: (newContent: string) => void;
    flushTracks: () => void;
    insert: (playlist: Playlist, shuffle: boolean) => void;
}

/* tslint:disable:max-line-length */
const PartySettings = (props: PartySettingsProps & PartySettingsDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .upper, .lower {
            padding: 10px 20px;
        }

        h3 {
            border-bottom: 1px solid #333;
            margin-bottom: 0;
        }

        #party-name {
            margin-bottom: 16px;
        }

        paper-spinner-lite {
            display: block;
            margin: 16px auto 16px auto;

            --paper-spinner-color: var(--primary-color);
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
            background: rgba(255, 255, 255, .15);
        }

        .fallback-playlist:hover {
            background: rgba(255, 255, 255, .2);
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

            .upper, .lower {
                width: 50%;
            }
        }
    </style>

    <div class="upper">
        <h3>General Settings</h3>
        <paper-input id="party-name"
                     label="Party Name"
                     value="${props.partyName}"
                     title="Change the name of your party"
                     type="text"
                     on-input="${ev => props.changePartyName((ev.target as HTMLInputElement).value)}">
        </paper-input>

        <paper-button raised
                      on-click="${props.flushTracks}"
                      title="Remove all but the playing track from the queue to start over">
            Flush queue
        </paper-button>
    </div>

    <div class="lower">
        <h3>Fallback Playlist</h3>
        <paper-input label="Search your playlists"
                     value="${props.playlistSearch}"
                     type="text"
                     on-input="${ev => props.changeSearchInput((ev.target as HTMLInputElement).value)}">
        </paper-input>

        ${props.isPlaylistLoadInProgress
            ? html`
                <paper-spinner-lite active alt="Loading playlists...">
                </paper-spinner-light>
            `
            : null}

        ${props.playlists.map(item => html`
            <div class="fallback-playlist">
                <h4>${item.name}</h4>

                <paper-icon-button class="shuffle-button"
                                   icon="festify:shuffle"
                                   on-click="${() => props.insert(item, true)}"
                                   title="Insert shuffled"
                                   disabled="${props.tracksLoadInProgress}">
                </paper-icon-button>
                <paper-icon-button icon="festify:add"
                                   on-click="${() => props.insert(item, false)}"
                                   title="Insert"
                                   disabled="${props.tracksLoadInProgress}">
                </paper-icon-button>
            </div>
        `)}
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartySettingsProps => ({
    isPlaylistLoadInProgress: state.settingsView.playlistLoadInProgress,
    partyName: (state.party.currentParty || { name: '' }).name,
    playlists: filteredPlaylistsSelector(state),
    playlistSearch: state.settingsView.playlistSearchQuery,
    tracksLoadInProgress: state.settingsView.tracksLoadInProgress,
    tracksLoaded: state.settingsView.tracksLoaded,
    tracksToLoad: state.settingsView.tracksToLoad,
});

const mapDispatchToProps: PartySettingsDispatch = {
    changePartyName,
    changeSearchInput,
    flushTracks,
    insert: insertPlaylist,
};

customElements.define(
    'party-settings',
    connect(
        mapStateToProps,
        mapDispatchToProps,
        PartySettings,
    ),
);
