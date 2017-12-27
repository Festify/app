import { connect, html, withExtended, withProps } from 'fit-html';

import { Reference, State, Track } from '../state';

interface PartyTrackProps {
    artistName: string;
    name: string;
    isTrackPlaying: boolean;
    track: Track;
    voteString: string;
}

interface PartyTrackDispatch {
    toggleVote: (ref: Reference) => void;
}

interface PartyTrackOwnProps {
    playing: boolean;
    track: Track;
}

const VoteButton = (props: PartyTrackProps & PartyTrackDispatch) => {
    if (props.isTrackPlaying) {
        return html`
            <paper-icon-button icon="[[_getLikeButtonIcon(track, _hasVoted)]]"
                               on-click="${ev => props.toggleVote(props.track.reference)}">
            </paper-icon-button>
        `;
    } else {
        html`
            <paper-fab mini
                       icon="[[_getPlayPauseButtonIcon(state.party.playback.playing)]]"
                       on-tap="_tapPlayPauseBtn"
                       disabled$="[[!state.isOwner]]">
            </paper-fab>
        `;
    }
};

/* tslint:disable:max-line-length */
const PartyTrack = (props: PartyTrackProps & PartyTrackDispatch) => html`
    <style>
        :host {
            box-sizing: content-box;
            padding: 5px 16px;
            display: flex;
            align-items: center;
            flex-direction: row;
        }
        
        .metadata-wrapper {
            margin-top: 2px;
            overflow: hidden;
        }
        
        :host([playing]) .metadata-wrapper {
            margin-right: 20px;
        }
        
        :host([playing]) size-aware-image {
            box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.5);
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
    
    <size-aware-image sorted-sizes="[[_getCoverImage(metadata.*, track)]]"></size-aware-image>
    <div class="metadata-wrapper">
        <h2>${props.name}</h2>
        <aside>
            <a>${props.artistName}</a>
            <span>&middot;</span>
            <span>${props.voteString}</span>
        </aside>
    </div>

    <div class="icon-wrapper">
        ${VoteButton(props)}
    </div>
`;
/* tslint:enable */

const mapStateToProps = (state: State, { playing, track }: PartyTrackOwnProps): PartyTrackProps => ({
    artistName: (state.metadata[track.id] || { artists: [] }).artists[0],
    name: (state.metadata[track.id] || { name: '' }).name,
    isTrackPlaying: playing,
    track,
    voteString: `${track.vote_count} Votes`,
});

const mapDispatchToProps: PartyTrackDispatch = {};

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
