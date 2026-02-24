'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { BookingsPageClient } from '@/features/booking-request/components/dashboard/BookingsPageClient';
import type { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { useAvailabilityBookingStore } from '@/features/availability/stores/availabilityBookingStore';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import React, { useEffect } from 'react';
import { AvailabilityBookingsView } from './AvailabilityBookingsView';

/**
 * V1 = booking requests (preferred date + time window); V2 = availability bookings (exact slot).
 * Legacy users (legacy_request_booking_enabled) see V1 when V2 is off; new users see "Turn on availability" prompt.
 */
export interface BookingsPageSwitchProps {
  businessName: string;
  /** V1 only: initial list of booking requests. V2 fetches its own data via API. */
  initialBookingRequests: BookingRequest[];
  /** From business_profiles.legacy_request_booking_enabled. When true, show V1 when V2 is off. */
  legacyRequestBookingEnabled: boolean;
  /** From business_availability.accept_bookings. When true, show V2 UI. */
  useAvailabilityBooking: boolean;
}

/**
 * Switches between V1, V2, or "Turn on availability" based on legacy flag and accept_bookings.
 */
export function BookingsPageSwitch({
  businessName,
  initialBookingRequests,
  legacyRequestBookingEnabled,
  useAvailabilityBooking,
}: BookingsPageSwitchProps) {
  const setAcceptBookings = useAvailabilityBookingStore(
    s => s.setAcceptBookings
  );

  // Keep store in sync with server so other parts of the app (e.g. after visiting Availability) see correct value
  useEffect(() => {
    setAcceptBookings(useAvailabilityBooking);
  }, [useAvailabilityBooking, setAcceptBookings]);

  if (useAvailabilityBooking) {
    return <AvailabilityBookingsView />;
  }

  if (legacyRequestBookingEnabled) {
    return (
      <BookingsPageClient
        businessName={businessName}
        initialBookings={initialBookingRequests}
      />
    );
  }

  // New user: no V1, prompt to set schedule and turn on availability
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          Turn on your schedule to get bookings
        </h3>
        <p className="text-gray-400 text-sm mt-2 mx-auto leading-relaxed">
          Right now customers can&apos;t book because your schedule is off. Turn
          it on and set your hours. Then new bookings will show up here.
        </p>
        <Button
          href={ROUTES.DASHBOARD.AVAILABILITY}
          variant="inverse"
          size="md"
          className="mt-6"
        >
          Go to Availability
        </Button>
      </div>
    </div>
  );
}
