import { routerForBrowser } from '@festify/redux-little-router';

export const enum Views {
    Home = 'Home',
    Party = 'Party',
    Tv = 'Tv',
}

export const enum PartyViews {
    Queue = 'Queue',
    Search = 'Search',
    Settings = 'Settings',
    Share = 'Share',
}

const routes = {
    '/': {
        title: 'Home',
        view: Views.Home,
    },
    '/party/:partyId': {
        title: 'Party',
        view: Views.Party,
        subView: PartyViews.Queue,
        '/search': {
            title: 'Search',
            view: Views.Party,
            subView: PartyViews.Search,
        },
        '/settings': {
            title: 'Party Settings',
            view: Views.Party,
            subView: PartyViews.Settings,
        },
        '/share': {
            title: 'Share Party',
            view: Views.Party,
            subView: PartyViews.Share,
        },
    },
    '/tv/:partyId': {
        title: 'TV Mode',
        view: Views.Tv,
    },
};

export const { reducer, middleware, enhancer } = routerForBrowser({ routes });
