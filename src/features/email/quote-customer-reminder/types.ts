export interface QuoteCustomerReminderPayload {
  customerName: string;
  businessName: string;
  serviceName: string;
  /** Same `/q/` URL we put in the SMS. */
  publicQuoteUrl: string;
  /** Public `/q/` link expiry (ISO). */
  expiresAt?: string | null;
}

export type SendQuoteCustomerReminderResult =
  | { sent: true }
  | { sent: false; error: string };
