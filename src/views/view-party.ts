import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-pages/iron-pages';
import '@polymer/paper-dialog/paper-dialog';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';

import { queueDragDrop, queueDragEnter, queueDragOver } from '../actions';
import { triggerOAuthLogin } from '../actions/auth';
import { changeDisplayLoginModal } from '../actions/view-party';
import { PartyViews } from '../routing';
import { Party, State } from '../state';
import sharedStyles from '../util/shared-styles';

import './party-queue';
import './party-search';
import './party-settings';
import './party-share';
import './playback-progress-bar';
import './queue-drawer';
import './search-bar';

interface PartyViewProps {
    displayLoginModal: boolean;
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

        iron-pages {
            padding-top: 120px;
        }

        app-drawer-layout:not([narrow]) [drawer-toggle] {
            display: none;
        }

        paper-dialog {
            background: var(--secondary-color);
        }

        paper-dialog-scrollable {
            display: block;
            padding: 0 2em;
            max-width: 300px;
            width: calc(100vw - 128px);
        }

        paper-dialog-scrollable paper-button {
            margin-bottom: 1em;
        }

        paper-dialog-scrollable paper-button:last-of-type {
            margin: 0;
        }

        paper-button.login {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
        }

        paper-button.login iron-icon {
            margin: 0 1em 0 .5em;
        }

        paper-button.login span {
            display: none;
            margin-right: .45ch;
        }

        paper-button.cancel {
            background: transparent;
        }

        paper-button.facebook {
            background: #3b5998;
        }

        paper-button.github {
            background: #333333;
        }

        paper-button.google {
            background: #dd4b39;
        }

        paper-button.spotify {
            background: #1db954;
        }

        paper-button.twitter {
            background: #1da1f2;
        }

        @media (min-width: 641px) {
            header {
                left: 256px;
            }

            header app-toolbar div[main-title] {
                margin-right: 0;
            }
        }

        @media (min-width: 420px) {
            paper-button.login span {
                display: inline;
            }
        }
    </style>

    <app-drawer-layout fullbleed>
        <app-drawer slot="drawer">
            <queue-drawer></queue-drawer>
        </app-drawer>

        <div>
            <header>
                <app-toolbar>
                    <paper-icon-button icon="festify:menu" drawer-toggle></paper-icon-button>
                    <div main-title>${props.party.name}</div>
                </app-toolbar>
                <search-bar></search-bar>
                <playback-progress-bar></playback-progress-bar>
            </header>

            <iron-pages selected="${props.view}" attr-for-selected="view" role="main">
                <party-queue view$="${PartyViews.Queue}"
                             on-dragenter="${props.trackDragEnter}"
                             on-drop="${props.trackDragDrop}"
                             on-dragover="${props.trackDragOver}">
                </party-queue>
                <party-search view$="${PartyViews.Search}"></party-search>
                <party-settings view$="${PartyViews.Settings}"></party-settings>
                <party-share view$="${PartyViews.Share}"></party-share>
            </iron-pages>
        </div>
    </app-drawer-layout>

    <paper-dialog with-backdrop
                  opened="${props.displayLoginModal}"
                  on-iron-overlay-canceled="${props.closeLoginModal}">
        <h2>Please sign in to vote</h2>

        <paper-dialog-scrollable>
            <p>
                The party owner requires all guests to sign in to prevent cheating,
                but you wouldn't do that anyway, would ya? 😛
            </p>

            <paper-button class="login facebook"
                          on-click="${props.triggerFacebookLogin}">
                <iron-icon icon="social:facebook"></iron-icon>
                <span>Sign in with</span>
                Facebook
            </paper-button>
            <paper-button class="login google"
                          on-click="${props.triggerGoogleLogin}">
                <iron-icon icon="social:google"></iron-icon>
                <span>Sign in with</span>
                Google
            </paper-button>
            <paper-button class="login twitter"
                          on-click="${props.triggerTwitterLogin}">
                <iron-icon icon="social:twitter"></iron-icon>
                <span>Sign in with</span>
                Twitter
            </paper-button>
            <paper-button class="login github"
                          on-click="${props.triggerGithubLogin}">
                <iron-icon icon="social:github"></iron-icon>
                <span>Sign in with</span>
                GitHub
            </paper-button>
            <paper-button class="login spotify"
                          on-click="${props.triggerSpotifyLogin}">
                <iron-icon icon="social:spotify"></iron-icon>
                <span>Sign in with</span>
                Spotify
            </paper-button>
        </paper-dialog-scrollable>

        <div class="buttons">
            <paper-button class="cancel"
                          on-click="${props.closeLoginModal}">
                Cancel
            </paper-button>
        </div>
    </paper-dialog>
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyViewProps => ({
    displayLoginModal: state.partyView.displayLoginModal,
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

customElements.define(
    'view-party',
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(PartyView),
);
