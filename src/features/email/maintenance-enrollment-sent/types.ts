export interface MaintenanceEnrollmentSentPayload {
  customerName: string;
  businessName: string;
  serviceName: string;
  priceCents: number;
  frequencyWeeks: number;
  durationMinutes: number;
  /** `YYYY-MM-DD` when the owner set a first visit; otherwise null. */
  anchorDate: string | null;
  /** `HH:mm` when the owner set a first visit; otherwise null. */
  anchorTime: string | null;
  publicEnrollmentUrl: string;
}

export type SendMaintenanceEnrollmentSentResult =
  | { sent: true }
  | { sent: false; error: string };
