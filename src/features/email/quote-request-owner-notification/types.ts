/**
 * Email to the business owner when a customer submits “Request quote” on the public profile.
 */

export interface QuoteRequestOwnerNotificationPayload {
  customerName: string;
  serviceName: string;
  /** Optional single line, e.g. "2020 Toyota Camry". */
  vehicleSummary: string | null;
  timeline: string | null;
  /** Truncated for the email body; full text is in the dashboard. */
  detailsPreview: string;
}

export interface SendQuoteRequestOwnerNotificationResult {
  sent: boolean;
  error?: string;
}
