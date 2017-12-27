import { html } from 'fit-html';

import { Image } from '../state';

export default (images: Image[]) => {
    if (images.length === 0) {
        return html`<img>`;
    }

    const largest = images.reduce((acc, img) => img.width > acc.width ? img : acc, images[0]);
    const srcset = images.map(img => `${img.url} ${img.width}w`).join(', ');
    return html`
        <img src="${largest.url}" srcset="${srcset}">
    `;
};
