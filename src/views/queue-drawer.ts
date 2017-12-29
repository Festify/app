import { FirebaseAuth } from '@firebase/auth-types';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/hardware-icons';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/social-icons';
import { connect, html, withExtended } from 'fit-html';

import { exitParty, navigateTo } from '../actions/queue-drawer';
import { PartyViews, Views } from '../routing';
import { isPartyOwnerSelector } from '../selectors/party';
import { State } from '../state';
import festifyLogo from '../util/festify-logo';
import firebase from '../util/firebase';
import sharedStyles from '../util/shared-styles';

interface QueueDrawerProps {
    isOwner: boolean;
    subView: PartyViews;
}

interface QueueDrawerDispatch {
    exitParty: () => void;
    navigateTo: (view: PartyViews | Views.Tv) => void;
}

const isActive = (isActive: boolean) => isActive ? 'active' : '';

/* tslint:disable:max-line-length */
const QueueDrawer = (props: QueueDrawerProps & QueueDrawerDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            color: rgba(255, 255, 255, .54);
            display: block;
            min-height: 100vh;
        }

        a, a:visited, .dropdown-content {
            color: rgba(0, 0, 0, .8);
            text-decoration: none;
            font-weight: bolder;
        }

        /*
         * Header
         */
        header {
            background:
                linear-gradient(rgba(0, 0, 0, .7), rgba(0, 0, 0, .7)),
                url(https://source.unsplash.com/512x352/?concert) no-repeat center;
            background-size: cover;
            height: 176px;
            position: relative;
        }

        header svg {
            margin: 16px 0 0 16px;
            height: 64px;
            width: 64px;
        }

        /*
         * Menu
         */
        .menu {
            display: block;
            margin-top: 24px;
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
            color: rgba(0, 0, 0, .54);
            margin: 0 16px 2px 0;
        }

        .menu a.active, .menu a.active iron-icon {
            color: var(--primary-color);
        }
    </style>

    <header>
        ${festifyLogo}
    </header>

    <div class="menu" role="menu">
        <a name="queue"
           class$="${isActive(props.subView === PartyViews.Queue || props.subView === PartyViews.Search)}"
           on-click="${() => props.navigateTo(PartyViews.Queue)}">
            <iron-icon icon="menu"></iron-icon>
            Queue
        </a>
        ${props.isOwner
            ? html`
                <a name="settings"
                   class$="${isActive(props.subView === PartyViews.Settings)}"
                   on-click="${() => props.navigateTo(PartyViews.Settings)}">
                    <iron-icon icon="settings"></iron-icon>
                    Party Settings
                </a>
            `
            : html``
        }
        <a name="share"
           class$="${isActive(props.subView === PartyViews.Share)}"
           on-click="${() => props.navigateTo(PartyViews.Share)}">
            <iron-icon icon="social:share"></iron-icon>
            Share Party
        </a>
        <a on-click="${() => props.navigateTo(Views.Tv)}">
            <iron-icon icon="hardware:tv"></iron-icon>
            TV Mode
        </a>
        <a href="https://festify.rocks/" target="_blank">
            <iron-icon icon="home"></iron-icon>
            Festify Homepage
        </a>
        <a role="button" on-click="${props.exitParty}">
            <iron-icon icon="cancel"></iron-icon>
            Exit Party
        </a>
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State): QueueDrawerProps => ({
    isOwner: isPartyOwnerSelector(state),
    subView: state.router.result.subView,
});

const mapDispatchToProps: QueueDrawerDispatch = {
    exitParty,
    navigateTo,
};

customElements.define(
    'queue-drawer',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        QueueDrawer,
    )),
);
