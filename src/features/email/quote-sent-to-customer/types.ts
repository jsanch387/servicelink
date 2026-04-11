export interface QuoteSentToCustomerPayload {
  customerName: string;
  serviceName: string;
  businessName: string;
  priceCents: number;
  /** `YYYY-MM-DD` */
  scheduledDate: string;
  /** `HH:mm` (24h) as entered for the quote */
  scheduledStartTime: string;
  durationMinutes: number;
  /** Owner-authored message on the quote. */
  note: string | null;
  /** Customer’s original request text (reference), when quote came from a request. */
  customerRequestMessage: string | null;
  vehicleLine: string | null;
  publicQuoteUrl: string;
}

export type SendQuoteSentToCustomerResult =
  | { sent: true }
  | { sent: false; error: string };
