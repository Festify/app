import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/hardware-icons';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/social-icons';
import { connect, html, withExtended } from 'fit-html';
import { createSelector } from 'reselect';

import { handleClick } from '../actions/queue-drawer';
import { PartyViews } from '../routing';
import { isPartyOwnerSelector, partyIdSelector } from '../selectors/party';
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
}

interface QueueDrawerDispatch {
    handleClick: (ev: Event, route: string) => void;
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
        <a href$="${props.queueRoute}"
           class$="${isActive(props.subView === PartyViews.Queue || props.subView === PartyViews.Search)}"
           on-click="${ev => props.handleClick(ev, props.queueRoute)}">
            <iron-icon icon="menu"></iron-icon>
            Queue
        </a>
        ${props.isOwner
            ? html`
                <a href$="${props.settingsRoute}"
                   class$="${isActive(props.subView === PartyViews.Settings)}"
                   on-click="${ev => props.handleClick(ev, props.settingsRoute)}">
                    <iron-icon icon="settings"></iron-icon>
                    Party Settings
                </a>
            `
            : null
        }
        <a href$="${props.shareRoute}"
           class$="${isActive(props.subView === PartyViews.Share)}"
           on-click="${ev => props.handleClick(ev, props.shareRoute)}">
            <iron-icon icon="social:share"></iron-icon>
            Share Party
        </a>
        <a href="${props.tvRoute}"
           on-click="${ev => props.handleClick(ev, props.tvRoute)}">
            <iron-icon icon="hardware:tv"></iron-icon>
            TV Mode
        </a>
        <a href="https://festify.rocks/" target="_blank">
            <iron-icon icon="home"></iron-icon>
            Festify Homepage
        </a>
        <a href="/"
           on-click="${ev => props.handleClick(ev, '/')}">
            <iron-icon icon="cancel"></iron-icon>
            Exit Party
        </a>
    </div>
`;
/* tslint:enable */

const queueRouteSelector = createSelector(
    partyIdSelector,
    partyId => `/party/${partyId}`,
);

const settingsRouteSelector = createSelector(
    queueRouteSelector,
    queueRoute => `${queueRoute}/settings`,
);

const shareRouteSelector = createSelector(
    queueRouteSelector,
    queueRoute => `${queueRoute}/share`,
);

const tvRouteSelector = createSelector(
    partyIdSelector,
    partyId => `/tv/${partyId}`,
);

const mapStateToProps = (state: State): QueueDrawerProps => ({
    isOwner: isPartyOwnerSelector(state),
    queueRoute: queueRouteSelector(state),
    settingsRoute: settingsRouteSelector(state),
    shareRoute: shareRouteSelector(state),
    subView: state.router.result.subView,
    tvRoute: tvRouteSelector(state),
});

const mapDispatchToProps: QueueDrawerDispatch = {
    handleClick,
};

customElements.define(
    'queue-drawer',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        QueueDrawer,
    )),
);
