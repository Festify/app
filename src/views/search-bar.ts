import '@polymer/iron-icons/iron-icons';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect, html, withExtended } from 'fit-html';

import { changeSearchInputText } from '../actions/view-party';
import { State } from '../state';
import festifyLogo from '../util/festify-logo';
import sharedStyles from '../util/shared-styles';

interface SearchBarProps {
    text: string;
}

interface SearchBarDispatch {
    changeText: (newValue: string) => void;
}

/* tslint:disable:max-line-length */
const SearchBar = (props: SearchBarProps & SearchBarDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            align-items: center;
            background-color: #fafafa;
            border-radius: 2px;
            box-shadow: 0 0 2px 0 rgba(0,0,0,0.12), 0 2px 2px 0 rgba(0,0,0,0.24);
            display: flex;
            height: 48px;
            position: relative;

            --icon-size: 24px;
        }

        paper-icon-button, svg {
            color: black;
            flex-shrink: 0;
        }

        paper-icon-button {
            margin: 0 4px;
            padding: 8px;

            --iron-icon-height: var(--icon-size);
            --iron-icon-width: var(--icon-size);
        }

        svg {
            margin: 0 12px;
            width: var(--icon-size);
        }

        input {
            background: transparent;
            border: 0;
            color: black;
            font-size: 16px;
            height: 100%;
            line-height: 24px;
            margin: 0 16px 0 0;
            width: 100%;
        }

        input:focus {
            outline: none;
        }

        input::-webkit-input-placeholder {
            color: rgba(0, 0, 0, .54);
        }
    </style>

    ${props.text
        ? html`<paper-icon-button icon="arrow-back" on-click="${() => props.changeText('')}"></paper-icon-button>`
        : festifyLogo}

    <input value="${props.text}"
           placeholder="Add Tracks"
           on-input="${ev => props.changeText((ev.target as HTMLInputElement).value)}">
`;
/* tslint:enable */

const mapStateToProps = (state: State): SearchBarProps => ({
    text: (state.router.params || { query: '' }).query || '',
});

const mapDispatchToProps: SearchBarDispatch = {
    changeText: changeSearchInputText,
};

customElements.define(
    'search-bar',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        SearchBar,
    )),
);
