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

export interface AvailabilityBookingPageProps {
  businessName: string;
  businessSlug: string;
  serviceName: string;
  serviceDurationMinutes?: number;
  servicePriceCents?: number;
  /** Mock weekly schedule (owner availability). */
  weeklySchedule: WeeklySchedule;
  /** Mock existing bookings to block slots. */
  existingBookings: ExistingBooking[];
}

export interface BookingSubmission {
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
  customer: CustomerFormData;
}
