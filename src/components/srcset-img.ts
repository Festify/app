import { html } from 'lit-html';

import { Image } from '../state';

export default (images: Image[] | null, size: string, alt: string = '') => {
    if (!images || images.length === 0) {
        return html`<img>`;
    }

    const largest = images.reduce((acc, img) => img.width > acc.width ? img : acc, images[0]);
    const srcset = images.map(img => `${img.url} ${img.width}w`).join(', ');
    return html`
        <img alt=${alt}
             src=${largest.url}
             srcset="${srcset}"
             sizes="${size}">
    `;
};
