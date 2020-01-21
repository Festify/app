import { connect, withFit } from 'fit-html';
import { html } from 'lit-html';

import srcsetImg from '../components/srcset-img';
import {
    artistJoinerFactory,
    singleMetadataSelector,
    singleTrackSelector,
} from '../selectors/track';
import { Metadata, State, Track } from '../state';

interface TvTrackProps {
    artistName: string | null;
    metadata: Metadata | null;
    track: Track | null;
}

interface TvTrackOwnProps {
    trackid: string;
}

const TvTrack = (props: TvTrackProps) => html`
    <style>
        :host {
            --max-width: 204px;
            min-width: var(--max-width);
            max-width: var(--max-width);
            display: block;
        }

        .cover {
            position: relative;
            display: flex;
            align-content: center;
            justify-content: center;
            width: var(--max-width);
            height: var(--max-width);
            box-shadow: 0 0 60px 0 rgba(0, 0, 0, 0.5);
        }

        img,
        .empty {
            width: 100%;
            height: 100%;
            position: absolute;
        }

        .overlay {
            position: absolute;
            z-index: 2;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.6);
        }

        h2 {
            z-index: 3;
            font-size: 5.556vh;
            margin: auto;
            text-shadow: 0 0 8px #000;
        }

        h3 {
            font-size: 1.852vh;
            font-weight: normal;
            margin: 10px 0 0;
        }

        h4 {
            font-size: 1.111vh;
            font-weight: 100;
            margin: 0;
        }

        h2,
        h3,
        h4 {
            color: #fff;
        }

        h3,
        h4 {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            max-width: 100%;
        }
    </style>

    <div class="cover">
        ${props.metadata
            ? srcsetImg(props.metadata.cover, '128px', props.metadata.name)
            : html`
                  <div class="empty"></div>
              `}
        <div class="overlay"></div>
        <h2>${props.track ? props.track.vote_count : 0}</h2>
    </div>
    <h3>${props.metadata ? props.metadata.name : 'Loading...'}</h3>
    <h4>${props.artistName}</h4>
`;

const mapStateToPropsFactory = () => {
    const artistJoiner = artistJoinerFactory();

    return (state: State, ownProps: TvTrackOwnProps): TvTrackProps => ({
        artistName: artistJoiner(state, ownProps.trackid),
        metadata: singleMetadataSelector(state, ownProps.trackid),
        track: singleTrackSelector(state, ownProps.trackid),
    });
};

const TvTrackBase = withFit<TvTrackOwnProps, TvTrackProps>(TvTrack, { trackid: String })(
    HTMLElement,
);

customElements.define('tv-track', connect(mapStateToPropsFactory, {})(TvTrackBase));
