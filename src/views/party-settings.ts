import { connect, html, withExtended } from 'fit-html';

import { State } from '../state';

interface PartySettingsProps {
}

interface PartySettingsDispatch {
}

/* tslint:disable:max-line-length */
const PartySettings = (props: PartySettingsProps & PartySettingsDispatch) => html`
`;
/* tslint:enable */

const mapStateToProps = (state: State): PartySettingsProps => ({});

const mapDispatchToProps: PartySettingsDispatch = {};

customElements.define(
    'party-settings',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        PartySettings,
    )),
);
