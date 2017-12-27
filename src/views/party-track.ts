import { connect, html, withExtended, withProps } from 'fit-html';

import srcsetImg from '../components/srcset-img';
import sharedStyles from '../util/shared-styles';
import { Metadata, Reference, State, Track } from '../state';

interface PartyTrackProps {
    canTogglePlayPause: boolean;
    isMusicPlaying: boolean;
    isPlayingTrack: boolean;
    metadata: Metadata | null;
    track: Track;
    voteString: string;
}

interface PartyTrackDispatch {
    togglePlayPause: () => void;
    toggleVote: (ref: Reference) => void;
}

interface PartyTrackOwnProps {
    playing: boolean;
    track: Track;
}

const ActionButton = (props: PartyTrackProps & PartyTrackDispatch) => {
    if (props.isPlayingTrack) {
        return html`
            <paper-icon-button icon="[[_getLikeButtonIcon(track, _hasVoted)]]"
                               on-click="${ev => props.toggleVote(props.track.reference)}">
            </paper-icon-button>
        `;
    } else {
        html`
            <paper-fab mini
                       icon="${props.isMusicPlaying ? 'av:pause' : 'av:play-arrow'}"
                       on-click="${props.togglePlayPause}"
                       disabled$="${!props.canTogglePlayPause}">
            </paper-fab>
        `;
    }
};

/* tslint:disable:max-line-length */
const PartyTrack = (props: PartyTrackProps & PartyTrackDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            box-sizing: content-box;
            padding: 5px 16px;
            display: flex;
            align-items: center;
            flex-direction: row;
        }

        :host([playing]) {
            background-color: #22262b;
            padding: 13px 16px;
        }
        
        :host([playing]) + :host {
            padding-top: 13px;
        }
        
        :host([playing]) .metadata-wrapper {
            margin-right: 20px;
        }
        
        :host([playing]) img {
            box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.5);
        }
        
        .metadata-wrapper {
            margin-top: 2px;
            overflow: hidden;
        }
        
        img {
            background: rgba(0, 0, 0, 0.2);
            flex-shrink: 0;
            height: 54px;
            margin-right: 15px;
            width: 54px;
        }
        
        h2 {
            margin: 0;
            font-weight: lighter;
            font-size: 15px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        
        aside {
            margin: 2px 0;
            font-weight: 300;
            font-size: 13px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        
        .icon-wrapper {
            margin-left: auto;
            flex-basis: 40px;
        }
        
        paper-fab {
            color: white;
            background-color: var(--primary-color);
        }
        
        paper-icon-button {
            margin-left: 5px;
            padding: 6px;
        }
    </style>
    
    ${srcsetImg((props.metadata || { cover: [] }).cover)}
    <div class="metadata-wrapper">
        <h2>${(props.metadata || { name: '' }).name}</h2>
        <aside>
            <a>${(props.metadata || { artistName: '' }).artistName}</a>
            <span>&middot;</span>
            <span>${props.voteString}</span>
        </aside>
    </div>

    <div class="icon-wrapper">
        ${ActionButton(props)}
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State, { playing, track }: PartyTrackOwnProps): PartyTrackProps => ({
    canTogglePlayPause: false,
    isMusicPlaying: false,
    isPlayingTrack: playing,
    metadata: state.metadata[track.id],
    track,
    voteString: `${track.vote_count} Votes`,
});

const mapDispatchToProps: PartyTrackDispatch = {
    togglePlayPause: () => {},
    toggleVote: () => {},
};

customElements.define(
    'party-track',
    withProps(withExtended(connect(
        mapStateToProps,
        mapDispatchToProps,
        PartyTrack,
    )), {
        playing: Boolean,
        track: null,
    }),
);
