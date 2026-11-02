export interface TeamInviteEmailPayload {
  businessName: string;
  recipientName: string;
  inviteUrl: string;
  expiresInDays: number;
}

export type SendTeamInviteEmailResult =
  | { sent: true; messageId?: string }
  | { sent: false; error: string };
