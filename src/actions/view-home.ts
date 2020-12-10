export type Actions = ReturnType<typeof changePartyId>;

export const CHANGE_PARTY_ID = 'CHANGE_PARTY_ID';

export const changePartyId = (partyId: string) => ({
    type: CHANGE_PARTY_ID as typeof CHANGE_PARTY_ID,
    payload: partyId,
});
