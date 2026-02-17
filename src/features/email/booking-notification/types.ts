/**
 * Types for the "new booking request" email to the business owner.
 */

export interface BookingNotificationPayload {
  customerName: string;
  serviceName: string;
  preferredDate: string;
  preferredTimeWindow: string;
}

export interface SendBookingNotificationResult {
  sent: boolean;
  error?: string;
}
