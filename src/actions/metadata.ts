import idb, { DB } from 'idb';

import { FANART_TV_API_KEY } from '../../common.config';
import { Metadata } from '../state';

export type Actions = ReturnType<typeof updateMetadata>;

export const UPDATE_METADATA = 'UPDATE_METADATA';

export function updateMetadata(
    meta: Record<string, Metadata> | SpotifyApi.TrackObjectFull[] | Record<string, string[]>,
) {
    function isFanartObj(
        meta: Record<string, Metadata> | Record<string, string[]>,
    ): meta is Record<string, string[]> {
        return Object.keys(meta).some(k => Array.isArray(meta[k]));
    }

    if (Array.isArray(meta)) {
        const payload: Record<string, Metadata> = {};
        for (const track of meta) {
            payload[`spotify-${track.id}`] = {
                artists: track.artists.map(art => art.name),
                cover: track.album.images.filter(img => img.width && img.height),
                durationMs: track.duration_ms,
                isrc: track.external_ids ? track.external_ids.isrc : undefined,
                isPlayable: track.is_playable !== false,
                name: track.name,
            } as Metadata;
        }

        return {
            type: UPDATE_METADATA as typeof UPDATE_METADATA,
            payload,
        };
    } else if (isFanartObj(meta)) {
        const payload: Record<string, Partial<Metadata>> = {};
        Object.keys(meta).forEach(key => (payload[key] = { background: meta[key] }));

        return {
            type: UPDATE_METADATA as typeof UPDATE_METADATA,
            payload,
        };
    } else {
        return {
            type: UPDATE_METADATA as typeof UPDATE_METADATA,
            payload: meta,
        };
    }
}

/* Utils */

interface StoredMetadata extends Metadata {
    dateCreated: number;
    trackId: string;
}

const META_IDB_TTL = 3600 * 1000 * 12; // 12h

export class MetadataStore {
    private db: Promise<DB>;

    constructor() {
        // Wrap IDB initialization to catch synchronous errors
        this.db = new Promise((res, rej) => {
            idb.open('Festify', 11, upgrade => {
                if (upgrade.objectStoreNames.contains('metadata')) {
                    upgrade.deleteObjectStore('metadata');
                }
                const store = upgrade.createObjectStore('metadata', { keyPath: 'trackId' });
                store.createIndex('dateCreated', 'dateCreated', { unique: false });
            })
                .then(res)
                .catch(rej);
        });
        this.deleteOld();
    }

    /**
     * Cache given metadata in IndexedDB.
     *
     * @param meta the metadata to cache
     */
    async cacheMetadata(meta: Record<string, Partial<Metadata>>) {
        const tx = (await this.db).transaction('metadata', 'readwrite');
        const store = tx.objectStore<StoredMetadata, string>('metadata');

        for (const trackId of Object.keys(meta)) {
            const item = meta[trackId];
            const storedItem = await store.get(trackId);

            await store.put({
                ...storedItem,
                ...(item as Required<Metadata>),
                dateCreated: Date.now(),
                trackId,
            });
        }

        await tx.complete;
    }

    /**
     * Loads cached metadata from IndexedDB.
     */
    async getMetadata(ids: Iterable<string>): Promise<Record<string, Metadata>> {
        const tx = (await this.db).transaction('metadata');
        const store = tx.objectStore<StoredMetadata, string>('metadata');

        const requestedTrackIds = new Set(ids);
        const lastDateCreated = IDBKeyRange.lowerBound(Date.now() - META_IDB_TTL, true);
        const stored: StoredMetadata[] = [];
        await store.index<string>('dateCreated').iterateCursor(lastDateCreated, cursor => {
            if (!cursor) {
                return;
            }
            if (requestedTrackIds.has(cursor.value.trackId)) {
                stored.push(cursor.value);
            }
            cursor.continue();
        });

        await tx.complete;

        return stored.reduce((acc, item) => {
            const { dateCreated, trackId, ...rest } = item;
            acc[trackId] = rest;
            return acc;
        }, {});
    }

    private async deleteOld() {
        try {
            const tx = (await this.db).transaction('metadata');
            const store = tx.objectStore<StoredMetadata, string>('metadata');
            const maxAge = IDBKeyRange.upperBound(Date.now() - META_IDB_TTL);

            await store.iterateKeyCursor(maxAge, async cursor => {
                if (!cursor) {
                    return;
                }
                await cursor.delete();
                cursor.continue();
            });

            await tx.complete;
        } catch (err) {
            console.log('Failed to clear out old metadata.', err);
        }
    }
}

const FANART_URL = 'https://webservice.fanart.tv/v3/music';
const MUSICBRAINZ_ARTIST_URL = 'https://musicbrainz.org/ws/2/artist/?fmt=json&limit=10&query=';
const MUSICBRAINZ_RECORDING_URL =
    'https://musicbrainz.org/ws/2/recording/?fmt=json&limit=10&query=';

/**
 * Gets fanart images of the given artist identified via its music brainz ID.
 *
 * @param {string} artistMbId the music brainz ID of the artist to get fanart images of.
 * @returns {Promise<string[] | null>} A promise with the fanart images or null, if none could be found.
 */
export async function getArtistFanart(artistMbId: string): Promise<string[] | null> {
    const fanartResponse = await fetch(`${FANART_URL}/${artistMbId}?api_key=${FANART_TV_API_KEY}`);

    if (!fanartResponse.ok) {
        return null;
    }

    const backgrounds = (await fanartResponse.json()).artistbackground;
    return backgrounds && backgrounds.length ? backgrounds.map(background => background.url) : null;
}

/**
 * Tries to get the music brainz ID of the artist associated with the given metadata.
 *
 * @param {Metadata} meta The metadata for whose artist to get the music brainz ID of.
 * @returns {Promise<string | null>} A promise with the music brainz ID of the artist or null, if it cannot be found.
 */
export async function getMusicBrainzId(meta: Metadata): Promise<string | null> {
    /**
     * Tries to get a the music brainz ID of the artist of the track identified with
     * the given ISRC.
     *
     * @param {string} isrc the ISRC of the track whose artist to search for
     * @returns {Promise<string | null>} A promise with the music brainz ID of the artist or null,
     * if it cannot be found.
     */
    async function tryFetchArtistViaIsrc(isrc: string): Promise<string | null> {
        const isrcResponse = await fetch(
            `${MUSICBRAINZ_RECORDING_URL}isrc:${encodeURIComponent(isrc)}`,
            { headers: { Accept: 'application/json' } },
        );
        if (!isrcResponse.ok) {
            return null;
        }
        const { recordings } = await isrcResponse.json();
        if (!recordings || !recordings.length) {
            return null;
        }
        const credits = recordings[0]['artist-credit'];
        if (!credits || !credits.length) {
            return null;
        }

        return credits[0].artist.id;
    }

    if (meta.isrc) {
        const maybeId = await tryFetchArtistViaIsrc(meta.isrc);
        if (maybeId) {
            return maybeId;
        }
    }

    const musicBrainzResponse = await fetch(
        `${MUSICBRAINZ_ARTIST_URL}${encodeURIComponent(meta.artists[0])}`,
        { headers: { Accept: 'application/json' } },
    );

    if (!musicBrainzResponse.ok) {
        return null;
    }

    const musicBrainzResult = await musicBrainzResponse.json();
    if (!musicBrainzResult.artists || !musicBrainzResult.artists.length) {
        return null;
    }

    /*
     * MusicBrainz has no concept of popularity and does not order the search results in
     * any meaningful way. This means that searches for popular artists can potentially
     * yield lots of unknown bands before the band actually searched for. (Searching for UK
     * rock band `Muse` lists them at index 5, preceeded by four unknown bands with the
     * same name).
     *
     * Under the assumption that Festify users generally like popular music and that popular
     * artists have more metadata on MusicBrainz than lesser known artists, we try to deduce
     * the right search result by choosing the artist with the most metadata / most complete
     * profile.
     */
    const likeliestArtist: { id: string } | null = musicBrainzResult.artists
        .filter(artist => artist.score >= 50)
        .reduce(
            (acc, it) => (acc && Object.keys(acc).length >= Object.keys(it).length ? acc : it),
            null,
        );

    return likeliestArtist ? likeliestArtist.id : null;
}
