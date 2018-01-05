import '@polymer/iron-icons/av-icons';
import '@polymer/iron-icons/iron-icons';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-input/paper-input';
import '@polymer/paper-spinner/paper-spinner-lite';
import { connect, html, withExtended } from 'fit-html';

import { changePartyName, changeSearchInput, insertPlaylist } from '../actions/party-settings';
import { filteredPlaylistsSelector } from '../selectors/playlists';
import { Playlist, State } from '../state';
import { repeat } from '../util/repeat';
import sharedStyles from '../util/shared-styles';

interface PartySettingsProps {
    isPlaylistLoadInProgress: boolean;
    partyName: string;
    playlistSearch: string;
    playlists: Playlist[];
}

interface PartySettingsDispatch {
    changePartyName: (newName: string) => void;
    changeSearchInput: (newContent: string) => void;
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
        <paper-input label="Party Name"
                     value="${props.partyName}"
                     title="Change the name of your party"
                     type="text"
                     on-input="${ev => props.changePartyName((ev.target as HTMLInputElement).value)}">
        </paper-input>
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

        ${repeat(props.playlists, pl => pl.reference.id, item => html`
            <div class="fallback-playlist">
                <h4>${item.name}</h4>

                <paper-icon-button class="shuffle-button"
                                   icon="av:shuffle"
                                   on-click="${() => props.insert(item, true)}"
                                   title="Insert shuffled">
                </paper-icon-button>
                <paper-icon-button icon="add"
                                   on-click="${() => props.insert(item, false)}"
                                   title="Insert">
                </paper-icon-button>
            </div>
        `)}
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartySettingsProps => ({
    isPlaylistLoadInProgress: state.settingsView.playlistLoadInProgress,
    partyName: (state.party.currentParty || { name: '' }).name,
    playlistSearch: state.settingsView.playlistSearchQuery,
    playlists: filteredPlaylistsSelector(state),
});

const mapDispatchToProps: PartySettingsDispatch = {
    changePartyName,
    changeSearchInput,
    insert: insertPlaylist,
};

customElements.define(
    'party-settings',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        PartySettings,
    )),
);
