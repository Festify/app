import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-pages/iron-pages';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';

import { queueDragDrop, queueDragEnter, queueDragOver } from '../actions';
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

interface PartyViewDispatch {
    trackDragEnter;
    trackDragOver;
    trackDragDrop;
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

        @media (min-width: 641px) {
            header {
                left: 256px;
            }

            header app-toolbar div[main-title] {
                margin-right: 0;
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
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartyViewProps => ({
    party: state.party.currentParty || { name: '' },
    view: (state.router.result || { subView: PartyViews.Queue }).subView,
});
const mapDispatchToProps: PartyViewDispatch = {
    trackDragEnter: queueDragEnter,
    trackDragOver: queueDragOver,
    trackDragDrop: queueDragDrop,
};

customElements.define(
    'view-party',
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(PartyView),
);
