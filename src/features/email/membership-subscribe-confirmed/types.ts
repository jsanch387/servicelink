export type MembershipSubscribeConfirmedPayload = {
  businessName: string;
  customerName: string | null;
  planName: string;
  cadenceLabel: string;
  amountCents: number;
  /** Signed public URL → Stripe Connect Customer Portal (manage / cancel). */
  manageUrl: string;
};

export type SendMembershipSubscribeConfirmedResult =
  | { sent: true }
  | { sent: false; error: string };
