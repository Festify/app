import '@polymer/paper-toast/paper-toast';
import { connect, withStore } from 'fit-html';
import { html } from 'lit-html';

import '../components/load-script-once';
import { Views } from '../routing';
import { isPlaybackMasterSelector } from '../selectors/party';
import { State } from '../state';
import { store } from '../store';
import iconSet from '../util/icons';

import './view-home';
import './view-party';
import './view-tv';

interface AppShellProps {
    isPlaybackMaster: boolean;
    isToastOpen: boolean;
    toastText: string;
    view: Views;
}

const Pages = (view: Views) => {
    switch (view) {
        default:
        case Views.Home:
            return html`
                <view-home></view-home>
            `;
        case Views.Party:
            return html`
                <view-party></view-party>
            `;
        case Views.Tv:
            return html`
                <view-tv></view-tv>
            `;
    }
};

const AppShellView = (props: AppShellProps) => html`
    <style>
        :host {
            --primary-color: #951518;
            --primary-color-dark: #731417;
            --secondary-color: #1c1f24;

            --primary-text-color: white;
            --secondary-text-color: #a9a9a9;

            background: var(--secondary-color);

            display: flex;
            justify-content: center;
            flex-direction: column;

            min-height: 100vh;
        }

        view-home {
            min-height: 100vh;
        }

        paper-toast {
            --paper-toast-background-color: var(--primary-color);
            box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 1);
        }
    </style>

    ${Pages(props.view)} ${iconSet}
    <paper-toast duration="0" .opened=${props.isToastOpen} .text=${props.toastText}> </paper-toast>
    <load-script-once .load=${props.isPlaybackMaster} src="https://sdk.scdn.co/spotify-player.js">
    </load-script-once>
`;

const mapStateToProps = (state: State): AppShellProps => ({
    isPlaybackMaster: isPlaybackMasterSelector(state),
    isToastOpen: !!state.appShell.currentToast,
    toastText: state.appShell.currentToast || '',
    view: (state.router!.result || { view: Views.Home }).view,
});

const Shell = connect(mapStateToProps, {})(AppShellView);

customElements.define('app-shell', withStore(store)(Shell));
