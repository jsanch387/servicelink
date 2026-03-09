/**
 * Availability Booking (customer flow) – types.
 * POC: UI and mock data only.
 */

import type { WeeklySchedule } from '../types/availability';

export interface ServiceSummary {
  name: string;
  durationMinutes: number;
  priceCents?: number;
}

export interface CustomerFormData {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

export interface ExistingBooking {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
}

export interface AddOnDisplay {
  id: string;
  name: string;
  priceCents: number;
}

export interface AvailabilityBookingPageProps {
  businessName: string;
  businessId: string;
  businessSlug: string;
  serviceId?: string;
  /** Comma-separated add-on IDs from service details page. */
  addOnIds?: string;
  serviceName: string;
  serviceDurationMinutes?: number;
  servicePriceCents?: number;
  /** Owner availability from DB. */
  weeklySchedule: WeeklySchedule;
  /** Fetched from API when businessSlug is set; omit to use [] or fetch internally. */
  existingBookings?: ExistingBooking[];
}

export interface BookingSubmission {
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
  customer: CustomerFormData;
}

/** Payload for POST /api/public/bookings (client → API). */
export interface CreateBookingRequest {
  businessSlug: string;
  businessId: string;
  serviceId?: string;
  serviceName: string;
  servicePriceCents?: number;
  durationMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  customer: CustomerFormData;
}
