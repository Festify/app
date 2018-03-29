import { createSelector } from 'reselect';

import { State } from '../state';

export const playlistsSelector = (state: State) => state.user.playlists;

export const searchQuerySelector = (state: State) => state.settingsView.playlistSearchQuery;

export const filteredPlaylistsSelector = createSelector(
    playlistsSelector,
    searchQuerySelector,
    (playlists, filter) => {
        if (!filter) {
            return playlists;
        }

        const lowercaseFilter = filter.toLowerCase();
        return playlists.filter(pl => pl.name.toLowerCase().includes(lowercaseFilter));
    },
);
