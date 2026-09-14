export const TEAM_INVITE_STATUSES = [
  'pending',
  'accepted',
  'revoked',
  'expired',
] as const;

export type TeamInviteStatus = (typeof TEAM_INVITE_STATUSES)[number];

export const PENDING_TEAM_INVITE_STATUS = 'pending' satisfies TeamInviteStatus;

export const TEAM_INVITE_EXPIRY_DAYS = 14;
