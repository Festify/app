import '@polymer/iron-icon/iron-icon';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect } from 'fit-html';
import { html } from 'lit-html';

import { logout, triggerOAuthLogin } from '../actions/auth';
import { handleLinkClick } from '../actions/nav';
import { toggleUserMenu } from '../actions/view-queue-drawer';
import { PartyViews } from '../routing';
import { isPartyOwnerSelector } from '../selectors/party';
import {
    queueRouteSelector,
    settingsRouteSelector,
    shareRouteSelector,
    tvRouteSelector,
} from '../selectors/routes';
import { currentUsernameSelector } from '../selectors/users';
import { State } from '../state';
import festifyLogo from '../util/festify-logo';
import sharedStyles from '../util/shared-styles';

interface QueueDrawerProps {
    isOwner: boolean;
    queueRoute: string;
    settingsRoute: string;
    shareRoute: string;
    subView: PartyViews;
    tvRoute: string;
    userMenuOpen: boolean;
    username: string | null;
}

interface QueueDrawerDispatch {
    handleClick: (ev: Event) => void;
    enterAdmin: () => void;
    logout: () => void;
    toggleUserMenu: () => void;
}

const isActive = (isActive: boolean) => (isActive ? 'active' : '');

/* tslint:disable:max-line-length */
const QueueDrawer = (props: QueueDrawerProps & QueueDrawerDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            color: rgba(255, 255, 255, 0.54);
            display: block;
            min-height: 100vh;
        }

        a,
        a:visited,
        .dropdown-content {
            color: rgba(0, 0, 0, 0.8);
            text-decoration: none;
            font-weight: bolder;
        }

        .hidable {
            transform-origin: 50% 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .hidable.hidden {
            opacity: 0;
            pointer-events: none;
            transform: scale3d(1, 1.1, 1);
        }

        /*
         * Header
         */
        header {
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
                url(https://source.unsplash.com/512x352/?concert) no-repeat center;
            background-size: cover;
            display: flex;
            flex-flow: column nowrap;
            height: 176px;
            position: relative;
        }

        header svg {
            margin: 16px 0 0 16px;
            height: 64px;
            width: 64px;
        }

        .user-menu {
            align-items: center;
            display: flex;
            font-weight: lighter;
            margin-top: auto;
            cursor: pointer;
        }

        .user-menu span {
            margin-left: 16px;
        }

        .user-menu paper-icon-button {
            margin-left: auto;
            transition: transform 0.3s ease;
        }

        .user-menu paper-icon-button.open {
            transform: rotate(-180deg);
        }

        /*
         * Menu
         */
        .menu {
            display: block;
            margin-top: 24px;
            position: absolute;
            width: 100%;
        }

        .menu a {
            display: block;
            font-size: 16px;
            line-height: 24px;
            margin: 0 0 24px 24px;
            cursor: pointer;
        }

        .menu iron-icon {
            color: rgba(0, 0, 0, 0.54);
            margin: 0 16px 2px 0;
        }

        .menu a.active,
        .menu a.active iron-icon {
            color: var(--primary-color);
        }
    </style>

    <header>
        ${festifyLogo}

        <div
            class="user-menu hidable ${props.username ? '' : 'hidden'}"
            @click=${props.toggleUserMenu}
        >
            <span>${props.username}</span>
            <paper-icon-button
                icon="festify:expand-more"
                class="${props.userMenuOpen ? 'open' : ''}"
                title="Open user menu"
            >
            </paper-icon-button>
        </div>
    </header>

    <div class="menu hidable ${props.userMenuOpen ? 'hidden' : ''}" role="menu">
        <a
            href="${props.queueRoute}"
            class="${isActive(
                props.subView === PartyViews.Queue || props.subView === PartyViews.Search,
            )}"
            @click=${props.handleClick}
        >
            <iron-icon icon="festify:menu"></iron-icon>
            Queue
        </a>
        ${props.isOwner
            ? html`
                  <a
                      href="${props.settingsRoute}"
                      class="${isActive(props.subView === PartyViews.Settings)}"
                      @click=${props.handleClick}
                  >
                      <iron-icon icon="festify:settings"></iron-icon>
                      Settings
                  </a>
              `
            : null}
        ${!props.isOwner
            ? html`
                  <a
                      href="#"
                      @click=${ev => {
                          ev.preventDefault();
                          props.enterAdmin();
                      }}
                  >
                      <iron-icon icon="festify:settings-remote"></iron-icon>
                      Login for Admin Mode
                  </a>
              `
            : null}

        <a
            href="${props.shareRoute}"
            class="${isActive(props.subView === PartyViews.Share)}"
            @click=${props.handleClick}
        >
            <iron-icon icon="festify:share"></iron-icon>
            Share
        </a>
        <a href="${props.tvRoute}" @click=${props.handleClick}>
            <iron-icon icon="festify:tv"></iron-icon>
            TV Mode
        </a>
        <a href="https://festify.rocks/" target="_blank">
            <iron-icon icon="festify:home"></iron-icon>
            Festify Homepage
        </a>
        <a href="/" @click=${props.handleClick}>
            <iron-icon icon="festify:cancel"></iron-icon>
            Exit Party
        </a>
    </div>

    <div class="menu hidable ${props.userMenuOpen ? '' : 'hidden'}" role="menu">
        <a
            href="#"
            @click=${ev => {
                ev.preventDefault();
                props.logout();
            }}
        >
            <iron-icon icon="festify:exit-to-app"></iron-icon>
            Logout
        </a>
        <a href="https://festify.rocks/disclaimer" target="_blank">
            <iron-icon icon="festify:gavel"></iron-icon>
            Legal
        </a>
        <a href="https://festify.rocks/privacy" target="_blank">
            <iron-icon icon="festify:verified-user"></iron-icon>
            Privacy
        </a>
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State): QueueDrawerProps => ({
    isOwner: isPartyOwnerSelector(state),
    queueRoute: queueRouteSelector(state)!,
    settingsRoute: settingsRouteSelector(state)!,
    shareRoute: shareRouteSelector(state)!,
    subView: state.router.result!.subView,
    tvRoute: tvRouteSelector(state)!,
    userMenuOpen: state.partyView.userMenuOpen,
    username: currentUsernameSelector(),
});

const mapDispatchToProps: QueueDrawerDispatch = {
    enterAdmin: () => triggerOAuthLogin('spotify'),
    handleClick: handleLinkClick,
    logout,
    toggleUserMenu,
};

customElements.define('queue-drawer', connect(mapStateToProps, mapDispatchToProps)(QueueDrawer));
