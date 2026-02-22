'use client';

import { useAvailabilityBookingStore } from '@/features/availability/stores/availabilityBookingStore';
import { ROUTES } from '@/constants/routes';
import { BookingsPageClient } from '@/features/booking-request/components/dashboard/BookingsPageClient';
import type { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
        <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">
        Set your schedule to receive bookings
      </h3>
      <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
        Turn on availability and set your weekly schedule. Until then, customers
        won&apos;t be able to book and you won&apos;t see bookings here.
      </p>
      <Link
        href={ROUTES.DASHBOARD.AVAILABILITY}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-white text-black font-medium px-5 py-2.5 text-sm hover:bg-gray-100 transition-colors"
      >
        Go to Availability
      </Link>
    </div>
  );
}
