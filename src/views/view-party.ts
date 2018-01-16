import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect, html, withExtended } from 'fit-html';

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
    party: Party | { name: string };
    view: PartyViews;
}
const mapStateToProps = (state: State): PartyViewProps => ({
    party: state.party.currentParty || { name: '' },
    view: (state.router.result || {}).subView || PartyViews.Queue,
});

interface PartyViewDispatch {
}
const mapDispatchToProps: PartyViewDispatch = {
};

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

            <main>
                ${Body(props.view)}
            </main>
        </div>
    </app-drawer-layout>
`;
/* tslint:enable */

customElements.define(
    'view-party',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        PartyView,
    )),
);
