export interface MaintenanceEnrollmentConfirmedPayload {
  businessName: string;
  serviceName: string;
  priceCents: number;
  /** YYYY-MM-DD when first visit is scheduled */
  visitDate: string;
  /** HH:mm */
  visitTime: string;
  durationMinutes: number;
  /** Drives receipt line items (card vs pay in person). */
  paidWithCard: boolean;
}

export interface SendMaintenanceEnrollmentConfirmedResult {
  sent: boolean;
  error?: string | null;
}
