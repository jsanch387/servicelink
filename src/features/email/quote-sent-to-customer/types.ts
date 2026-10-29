import type { QuotePaymentCollection } from '@/features/quotes/shared/quotePaymentCollection';

export interface QuoteSentToCustomerPayload {
  customerName: string;
  serviceName: string;
  businessName: string;
  priceCents: number;
  /** Set when tax was added. `priceCents` stays the pre-tax quote. */
  salesTax?: {
    label: string;
    taxCents: number;
  } | null;
  /** `YYYY-MM-DD`, or null when customer will choose on accept */
  scheduledDate: string | null;
  /** `HH:mm` (24h), or null when customer will choose on accept */
  scheduledStartTime: string | null;
  durationMinutes: number;
  /** Owner-authored message on the quote. */
  note: string | null;
  /** Customer’s original request text (reference), when quote came from a request. */
  customerRequestMessage: string | null;
  vehicleLine: string | null;
  publicQuoteUrl: string;
  /** Public `/q/` link expiry (ISO). Shown as “Valid until …”. */
  expiresAt?: string | null;
  /** Optional catalog add-ons for a clearer email breakdown. */
  addonDetails?: Array<{
    name: string;
    priceCents: number;
  }> | null;
  /** How the customer pays to accept. Omitted on older sends. */
  payment?: {
    collection: QuotePaymentCollection;
    /** Due now when a deposit applies. Null when they pay in full or nothing is due. */
    depositCents: number | null;
  } | null;
}

export type SendQuoteSentToCustomerResult =
  | { sent: true }
  | { sent: false; error: string };
