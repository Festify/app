import { connect } from 'fit-html';
import { html } from 'lit-html';
import { createSelector } from 'reselect';

import { playbackSelector } from '../selectors/party';
import { currentTrackIdSelector, metadataSelector } from '../selectors/track';
import { Metadata, Playback, State } from '../state';

export interface ProgressBarProps {
    durationMs: number;
    playback: Playback | null;
}

const ProgressBarView = (props: ProgressBarProps) => html`
    <style>
        :host {
            display: block;
            height: 1px;
            position: relative;
            width: 100%;
        }

        div {
            background: white;
            height: 100%;
            width: 100%;
            transform-origin: left;
        }
    </style>

    <div id="indicator"></div>
`;

const currentDurationSelector = createSelector(
    metadataSelector,
    currentTrackIdSelector,
    (metadata: Record<string, Metadata>, trackId: string | null) =>
        trackId && trackId in metadata ? metadata[trackId].durationMs : 0,
);

const mapDispatchToProps = (state: State): ProgressBarProps => ({
    durationMs: currentDurationSelector(state),
    playback: playbackSelector(state),
});

const ProgressBarBase = connect(mapDispatchToProps, {})(ProgressBarView);

class ProgressBar extends ProgressBarBase {
    private indicator: HTMLElement;

    render() {
        super.render();

        const { durationMs, playback }: ProgressBarProps = this.renderProps;
        if (!playback || durationMs <= 0) {
            this.transitionTo(0, 0, false);
            return;
        }

        const { last_change, last_position_ms, playing } = playback;

        let currentPercentage = last_position_ms / durationMs;
        if (playing) {
            const timeDiff = Date.now() - last_change;
            currentPercentage += timeDiff / durationMs;
        }
        window.requestAnimationFrame(() => {
            this.transitionTo(currentPercentage * 100, 0, playing);
            if (playing) {
                // Give the compositor a chance to reset the transitions
                // before we start the actual animation.
                window.requestAnimationFrame(() => {
                    const remainingDurationMs = durationMs * (1 - currentPercentage);
                    this.transitionTo(100, remainingDurationMs, playing);
                });
            }
        });
    }

    private getIndicator(): HTMLElement {
        if (this.indicator) {
            return this.indicator;
        }

        this.indicator = this.shadowRoot!.getElementById('indicator')!;
        return this.indicator;
    }

    private transitionTo(percentage: number, durationMs: number, isPlaying: boolean) {
        const value = `opacity 0.25s ease, transform ${durationMs}ms linear`;
        const style = this.getIndicator().style;
        style.transition = value;
        style.opacity = String(isPlaying ? 1 : 0.5);
        style.transform = `scaleX(${percentage / 100})`;
    }
}

customElements.define('playback-progress-bar', ProgressBar);
