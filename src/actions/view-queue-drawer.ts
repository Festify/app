import { Types } from '.';

export type Actions =
    | ToggleUserMenuAction;

export interface ToggleUserMenuAction {
    type: Types.TOGGLE_USER_MENU;
}

export function toggleUserMenu(): ToggleUserMenuAction {
    return { type: Types.TOGGLE_USER_MENU };
}
