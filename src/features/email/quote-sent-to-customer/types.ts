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
  note: string | null;
  vehicleLine: string | null;
  publicQuoteUrl: string;
}

export type SendQuoteSentToCustomerResult =
  | { sent: true }
  | { sent: false; error: string };
