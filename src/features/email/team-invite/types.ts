export interface TeamInviteEmailPayload {
  businessName: string;
  inviteUrl: string;
}

export type SendTeamInviteEmailResult =
  | { sent: true; messageId?: string }
  | { sent: false; error: string };
