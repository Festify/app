import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect, html, withExtended } from 'fit-html';

import { PartyViews } from '../routing';
import { Party, State } from '../state';
import sharedStyles from '../util/shared-styles';

interface PartyViewProps {
    party: Party;
    view: PartyViews;
}
interface PartyViewDispatch {
}

const Body = (view: PartyViews) => {
    switch (view) {
        case PartyViews.Queue:
            return html`<party-queue></party-queue>`;
        case PartyViews.Search:
            return html`<party-search></party-search>`;
        case PartyViews.Settings:
            return html`<party-settings></party-settings>`;
        case PartyViews.Share:
            return html`<party-share></party-share>`;
    }
};

/* tslint:disable:max-line-length */
const PartyView = (props: PartyViewProps & PartyViewDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            --track-bg: #22262b;
            --track-bg-even: #25292e;
        }

        app-drawer {
            z-index: 2;
        }

        header {
            background-color: #212121;
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1;
        }

        app-drawer[persistent] + div header {
            left: 256px;
        }

        header app-toolbar {
            height: 48px;
            padding: 8px;
        }

        header app-toolbar paper-icon-button {
            padding: 12px;

            width: 48px;
            height: 48px;

            --paper-icon-button-ink-color: white;
        }

        header app-toolbar div[main-title] {
            margin-right: 64px;
            text-align: center;
            flex-grow: 1;
        }

        header search-bar {
            margin: 8px 8px 16px;
        }

        header playback-progress-bar {
            bottom: 0;
            position: absolute;
            width: 100%;
        }

        main {
            padding-top: 120px;
        }

        app-drawer-layout:not([narrow]) [drawer-toggle] {
            display: none;
        }
    </style>

    <app-drawer-layout fullbleed>
        <app-drawer slot="drawer">
            <queue-drawer page="{{page}}"
                          state="[[state]]"
                          tv-url="[[_castUrl]]">
            </queue-drawer>
        </app-drawer>

        <div>
            <header>
                <app-toolbar>
                    <paper-icon-button icon="menu" drawer-toggle></paper-icon-button>
                    <div main-title>[[state.party.name]]</div>
                </app-toolbar>
                <search-bar value="{{searchQuery}}" placeholder="Add Tracks"></search-bar>
                <playback-progress-bar duration="[[_getTrackDuration(state.*, _trackMeta.*)]]"
                                       playback="[[state.party.playback]]">
                </playback-progress-bar>
            </header>

            <main>
                ${Body(props.view)}
            </main>
            <iron-pages selected="[[page]]"
                        attr-for-selected="view">
                <div class="track-list" view="queue">
                    <div id="skipBackground"
                         style$="display: [[_getDisplaySkipIndicator(tracks.length, state.isOwner)]]">
                        <p id="skipIndicator">Skip</p>
                    </div>

                    <dom-flip id="trackAnimator">
                        <template is="dom-repeat"
                                  id="trackList"
                                  items="[[tracks]]"
                                  on-dom-change="_trackListChange">
                            <queue-track data-flip-id$="[[_generateFbId(item)]]"
                                         metadata="[[_trackMeta]]"
                                         state="[[state]]"
                                         track="[[item]]"
                                         user-votes="[[_userVotes]]">
                            </queue-track>
                        </template>
                    </dom-flip>

                    <p>
                        <paper-button hidden$="[[_getDisplayLoadRestButton(tracks.length, _trackLimit)]]"
                                      on-tap="_loadAllTracks"
                                      raised>
                            There's more! Load the rest
                        </paper-button>
                    </p>
                </div>

                <div class="track-list" view="search">
                    <template is="dom-repeat" items="[[_searchResults]]">
                        <queue-track metadata="[[_searchMeta]]"
                                     state="[[state]]"
                                     track="[[item]]"
                                     user-votes="[[_userVotes]]">
                        </queue-track>
                    </template>
                </div>

                <view-settings view="settings"
                               is-loading="[[_playlistsLoading]]"
                               playlists="[[_playlists]]"
                               state="{{state}}">
                </view-settings>

                <view-share view="share" state="[[state]]"></view-share>
            </iron-pages>
        </div>
    </app-drawer-layout>
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyViewProps => ({

});

const mapDispatchToProps: PartyViewDispatch = {
};

customElements.define(
    'view-party',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        PartyView,
    )),
);
