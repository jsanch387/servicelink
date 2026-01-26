/**
 * Booking Request Types
 *
 * Types for the booking request feature.
 */

export interface BookingRequestFormData {
  name: string;
  phone: string;
  preferredDate: string;
  preferredTimeWindow: string;
  service: string;
  message?: string;
}

export interface BookingRequestSubmitData extends BookingRequestFormData {
  businessId?: string;
  businessSlug?: string;
  submittedAt: string;
}
