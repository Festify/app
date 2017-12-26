import { connect, html } from 'fit-html';

import { Views } from '../routing';
import { State } from '../state';

import './view-home';

interface AppShellProps {
    view: Views;
}

const Pages = (view: Views) => {
    switch (view) {
        case Views.Home:
            return html`<view-home></view-home>`;
        case Views.Party:
            return html`<view-party></view-party>`;
        case Views.Tv:
            return null;
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

        paper-toast {
            --paper-toast-background-color: var(--primary-color);
            box-shadow: 0 1px 10px 0 rgba(0,0,0,1);
        }
    </style>

    ${Pages(props.view)}
    <paper-toast id="toast"></paper-toast>
`;

const mapStateToProps = (state: State): AppShellProps => ({
    view: (state.router.result || {}).view,
});

const AppShell = connect(
    mapStateToProps,
    {},
    AppShellView,
);

customElements.define('app-shell', AppShell);
export default AppShell;
