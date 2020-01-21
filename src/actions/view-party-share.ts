export type Actions = ReturnType<typeof shareParty>;

export const SHARE_PARTY = 'SHARE_PARTY';

export const shareParty = () => ({ type: SHARE_PARTY as typeof SHARE_PARTY });
