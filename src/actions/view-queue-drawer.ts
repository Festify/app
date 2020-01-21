export type Actions = ReturnType<typeof toggleUserMenu>;

export const TOGGLE_USER_MENU = 'TOGGLE_USER_MENU';

export const toggleUserMenu = () => ({ type: TOGGLE_USER_MENU as typeof TOGGLE_USER_MENU });
