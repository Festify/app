import '@polymer/paper-button/paper-button';
import '@polymer/paper-input/paper-input';
import { connect } from 'fit-html';
import { html } from 'lit-html';

import { State } from '../state';
import sharedStyles from '../util/shared-styles';

interface ViewShareProps {
    domain: string;
    hasShareApi: boolean;
    partyId: string;
    partyName: string;
}

/* tslint:disable:max-line-length */
const ViewShare = (props: ViewShareProps) => html`
    ${sharedStyles}
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

        .party-id {
            font-size: 32px;
            margin-bottom: 16px;
            text-align: center;
            user-select: text;
        }
    </style>

    <p class="description">
        Add new songs to the queue by searching for them or ask your guests to go to
        <span class="domain">${props.domain}</span>
        and enter this code:
    </p>

    <div class="party-id">${props.partyId}</div>

    ${props.hasShareApi
        ? html`
              <paper-button
                  raised
                  @click=${() =>
                      (navigator as any).share({
                          title: props.partyName,
                          text: `Join ${props.partyName} and rule the music!`,
                          url: `${document.location!.origin}/party/${props.partyId}`,
                      })}
              >
                  Share
              </paper-button>
          `
        : null}
`;
/* tslint:enable */

const mapStateToProps = (state: State): ViewShareProps => ({
    domain: document.location!.host,
    hasShareApi: Boolean((navigator as any).share),
    partyId: state.party.currentParty ? state.party.currentParty.short_id : '',
    partyName: state.party.currentParty ? state.party.currentParty.name : '',
});

customElements.define('party-share', connect(mapStateToProps, {})(ViewShare));
