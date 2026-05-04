export interface MaintenanceEnrollmentConfirmedPayload {
  customerName: string;
  businessName: string;
  serviceName: string;
  priceCents: number;
  /** YYYY-MM-DD when first visit is scheduled */
  visitDate: string;
  /** HH:mm */
  visitTime: string;
  durationMinutes: number;
  frequencyWeeks: number;
  /** Short label, e.g. "Paid with card" or "Pay in person" */
  paymentSummary: string;
  /** Drives receipt line items (card vs pay in person). */
  paidWithCard: boolean;
}

export interface SendMaintenanceEnrollmentConfirmedResult {
  sent: boolean;
  error?: string | null;
}
