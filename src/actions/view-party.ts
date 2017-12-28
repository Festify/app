import { PayloadAction, Types } from '.';

export type Actions =
    | ChangeSearchInputTextAction;

export interface ChangeSearchInputTextAction extends PayloadAction<string> {
    type: Types.CHANGE_SEARCH_INPUT_TEXT;
}

export function changeSearchInputText(text: string): ChangeSearchInputTextAction {
    return {
        type: Types.CHANGE_SEARCH_INPUT_TEXT,
        payload: text,
    };
}
