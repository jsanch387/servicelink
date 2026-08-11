export type MembershipManageLinkPayload = {
  businessName: string;
  customerName: string | null;
  planName: string;
  /** Signed public URL → Stripe Connect Customer Portal. */
  manageUrl: string;
};

export type SendMembershipManageLinkResult =
  | { sent: true }
  | { sent: false; error: string };
