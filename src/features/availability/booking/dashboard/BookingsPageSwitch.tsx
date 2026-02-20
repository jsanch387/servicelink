'use client';

import { useAvailabilityBookingStore } from '@/features/availability/stores/availabilityBookingStore';
import { BookingsPageClient } from '@/features/booking-request/components/dashboard/BookingsPageClient';
import type { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { AvailabilityBookingsView } from './AvailabilityBookingsView';

export interface BookingsPageSwitchProps {
  businessName: string;
  initialBookings: BookingRequest[];
}

/**
 * Switches between Request Booking (V1) and Availability Booking (V2) based on
 * the "Accept Bookings" toggle on the Availability route. Lives under availability
 * feature; request booking is only used when toggle is OFF.
 */
export function BookingsPageSwitch({
  businessName,
  initialBookings,
}: BookingsPageSwitchProps) {
  const acceptBookings = useAvailabilityBookingStore(s => s.acceptBookings);

  return acceptBookings ? (
    <AvailabilityBookingsView />
  ) : (
    <BookingsPageClient
      businessName={businessName}
      initialBookings={initialBookings}
    />
  );
}
