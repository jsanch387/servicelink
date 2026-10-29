export type MembershipInvoiceEmailPayload = {
  businessName: string;
  customerName: string | null;
  planName: string;
  cadenceLabel: string;
  amountCents: number;
  /** e.g. "Mar 1 – Mar 31, 2026" */
  periodLabel: string;
  /** e.g. "Mar 1, 2026" */
  eventDateLabel: string;
  /** Stripe Customer Portal (manage / update card). */
  manageUrl: string;
  /**
   * Present only when this charge is the plan price plus its stored tax.
   * Older subscribers billed the pre-tax price omit this.
   */
  salesTax?: { label: string; taxCents: number };
};

export type SendMembershipInvoiceEmailResult =
  | { sent: true }
  | { sent: false; error: string };
