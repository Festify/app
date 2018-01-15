import '@polymer/paper-input/paper-input';

import { connect, html, withExtended } from 'fit-html';

import { State } from '../state';

interface ViewShareProps {
    domain: string;
    partyId: string;
}

interface ViewShareDispatch {
}

/* tslint:disable:max-line-length */
const ViewShare = (props: ViewShareProps & ViewShareDispatch) => html`
    <style>
        :host {
            display: block;
            padding: 10px 20px;
        }

        .description {
            font-size: 20px;
        }

        .description .domain {
            text-decoration: underline;
            white-space: nowrap;
        }

        paper-input {
            text-align: center;
        }
    </style>

    <p class="description">
        Add new songs to the queue by searching for them or ask your guests to go to
        <span class="domain">${props.domain}</span>
        and enter this code:
    </p>

    <paper-input value="${props.partyId}"
                 label="Party ID"
                 readonly>
    </paper-input>
`;
/* tslint:enable */

const mapStateToProps = (state: State): ViewShareProps => ({
    domain: document.location.origin,
    partyId: state.party.currentParty
        ? state.party.currentParty.short_id
        : '',
});

const mapDispatchToProps: ViewShareDispatch = {};

customElements.define(
    'party-share',
    withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        ViewShare,
    )),
);
