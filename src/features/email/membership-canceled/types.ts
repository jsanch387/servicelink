export type MembershipCanceledEmailKind = 'at_period_end' | 'immediate';

export type MembershipCanceledEmailPayload = {
  businessName: string;
  customerName: string | null;
  planName: string;
  kind: MembershipCanceledEmailKind;
  /** When access ends (ISO). Used for at-period-end copy. */
  accessUntilIso?: string | null;
};

export type SendMembershipCanceledEmailResult =
  | { sent: true }
  | { sent: false; error: string };
