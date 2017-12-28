import '@polymer/paper-button/paper-button';
import '@polymer/paper-input/paper-input';
import '@polymer/polymer/lib/elements/custom-style';
import { connect, html, withExtended } from 'fit-html';

import { changePartyId, createParty, joinParty } from '../actions/view-home';
import { State } from '../state';
import festifyLogo from '../util/festify-logo';
import sharedStyles from '../util/shared-styles';

interface HomeViewProps {
    partyId: string;
    partyIdValid: boolean;
}
interface HomeViewDispatch {
    changePartyId: (partyId: string) => void;
    createParty: () => void;
    joinParty: () => void;
}

/* tslint:disable:max-line-length */
const HomeView = (props: HomeViewProps & HomeViewDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            min-height: 500px;
            padding: 0 10px;
            text-align: center;

            --paper-input-container-input: {
                font-size: 24px;
            }

            --paper-input-container-label: {
                font-size: 20px;
            }
        }

        svg {
            height: 150px;
            width: 150px;
        }

        p {
            padding: 0 25px;
        }

        main {
            display: flex;
            flex-flow: column nowrap;

            margin: 0 auto;
            min-width: 250px;
            height: 180px;
        }

        #middle {
            margin: 20px 0 20px 0;
        }
    </style>

    <header>
        ${festifyLogo}
    </header>

    <p>Festify is a free Spotify-powered app that lets your guests choose which music should be played using their smartphones.</p>

    <main>
        <paper-input label="Party ID"
                     type="tel"
                     on-value-changed="${ev => props.changePartyId((ev.target as HTMLInputElement).value)}">
        </paper-input>
        <paper-button id="middle"
                      raised
                      disabled="${!props.partyIdValid}"
                      on-click="${props.joinParty}">
            Join Party
        </paper-button>
        <paper-button raised
                      on-click="${props.createParty}">
            Create Party
        </paper-button>
    </main>
`;
/* tslint:enable */

const mapStateToProps = (state: State): HomeViewProps => state.homeView;

const mapDispatchToProps: HomeViewDispatch = {
    changePartyId,
    createParty,
    joinParty,
};

customElements.define(
    'view-home',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        HomeView,
    )),
);