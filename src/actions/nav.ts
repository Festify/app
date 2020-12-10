import { push } from '@festify/redux-little-router';

export const handleLinkClick = (event: MouseEvent) => {
    if (
        (event.button && event.button !== 0) || // BTN Left
        event.shiftKey ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.defaultPrevented
    ) {
        return;
    }

    const target = event.currentTarget;
    if (!target || !(target instanceof HTMLAnchorElement)) {
        return;
    }

    event.preventDefault();
    return push(target.pathname + target.search);
};
