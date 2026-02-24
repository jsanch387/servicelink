/**
 * Types for the "new availability booking" email to the business owner (V2).
 */

export interface AvailabilityBookingNotificationPayload {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  servicePriceCents?: number;
}

export interface SendAvailabilityBookingNotificationResult {
  sent: boolean;
  error?: string;
}
