import { routerForBrowser } from '@mraerino/redux-little-router-reactless';

export const enum Views {
    Home,
    Party,
    Tv,
}

export const enum PartyViews {
    Queue,
    Search,
    Settings,
    Share,
}

const routes =  {
    '/': {
        title: "Home",
        view: Views.Home,
    },
    '/party/:partyId': {
        title: "Party",
        view: Views.Party,
        '/search/:query': {
            title: "Search",
            view: Views.Party,
            subView: PartyViews.Search,
        },
        '/settings': {
            title: "Party Settings",
            view: Views.Party,
            subView: PartyViews.Settings,
        },
        '/share': {
            title: "Share Party",
            view: Views.Party,
            subView: PartyViews.Share,
        },
    },
    '/tv/:partyId': {
        title: "TV Mode",
        view: Views.Tv,
    },
};

export const {
    reducer,
    middleware,
    enhancer,
} = routerForBrowser({ routes });
