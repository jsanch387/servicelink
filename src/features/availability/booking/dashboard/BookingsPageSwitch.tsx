'use client';

import { useAvailabilityBookingStore } from '@/features/availability/stores/availabilityBookingStore';
import { BookingsPageClient } from '@/features/booking-request/components/dashboard/BookingsPageClient';
import type { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { AvailabilityBookingsView } from './AvailabilityBookingsView';

/**
 * V1 = booking requests (preferred date + time window); V2 = availability bookings (exact slot).
 * Kept separate so V1 can be decommissioned later without touching V2.
 */
export interface BookingsPageSwitchProps {
  businessName: string;
  /** V1 only: initial list of booking requests. V2 fetches its own data via API. */
  initialBookingRequests: BookingRequest[];
}

/**
 * Switches between V1 (Request Booking) and V2 (Availability Bookings) based on
 * the "Accept Bookings" toggle. V1 gets data from props; V2 fetches from GET /api/availability/bookings.
 */
export function BookingsPageSwitch({
  businessName,
  initialBookingRequests,
}: BookingsPageSwitchProps) {
  const acceptBookings = useAvailabilityBookingStore(s => s.acceptBookings);

  return acceptBookings ? (
    <AvailabilityBookingsView />
  ) : (
    <BookingsPageClient
      businessName={businessName}
      initialBookings={initialBookingRequests}
    />
  );
}
