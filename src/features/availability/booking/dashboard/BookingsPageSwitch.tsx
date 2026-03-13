'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAvailabilityBookingStore } from '@/features/availability/stores/availabilityBookingStore';
import { BookingsPageClient } from '@/features/booking-request/components/dashboard/BookingsPageClient';
import type { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import { FreeBookingsTracker } from '@/features/pricing';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { AvailabilityBookingsView } from './AvailabilityBookingsView';

/**
 * V1 = booking requests (preferred date + time window); V2 = availability bookings (exact slot).
 * When V2 is off: show V1 only if showRequestBookingFallback (legacy user who never set availability); else "Turn on availability" prompt.
 */
export interface BookingsPageSwitchProps {
  businessName: string;
  /** V1 only: initial list of booking requests. V2 fetches its own data via API. */
  initialBookingRequests: BookingRequest[];
  /** When true, show V1 (request booking) when V2 is off. False when legacy user has set availability (no fallback). */
  showRequestBookingFallback: boolean;
  /** From business_availability.accept_bookings. When true, show V2 UI. */
  useAvailabilityBooking: boolean;
  /** Free plan: bookings used this month (0–5). Shown in tracker. */
  freeBookingsUsed?: number;
  /** When false (Pro), hide the free bookings tracker. */
  showFreeBookingsTracker?: boolean;
}

/**
 * Switches between V1, V2, or "Turn on availability" based on accept_bookings and request-booking fallback.
 */
export function BookingsPageSwitch({
  businessName,
  initialBookingRequests,
  showRequestBookingFallback,
  useAvailabilityBooking,
  freeBookingsUsed = 0,
  showFreeBookingsTracker = true,
}: BookingsPageSwitchProps) {
  const setAcceptBookings = useAvailabilityBookingStore(
    s => s.setAcceptBookings
  );

  // Keep store in sync with server so other parts of the app (e.g. after visiting Availability) see correct value
  useEffect(() => {
    setAcceptBookings(useAvailabilityBooking);
  }, [useAvailabilityBooking, setAcceptBookings]);

  if (useAvailabilityBooking) {
    return (
      <AvailabilityBookingsView
        freeBookingsUsed={freeBookingsUsed}
        showFreeBookingsTracker={showFreeBookingsTracker}
      />
    );
  }

  if (showRequestBookingFallback) {
    return (
      <BookingsPageClient
        businessName={businessName}
        initialBookings={initialBookingRequests}
        freeBookingsUsed={freeBookingsUsed}
        showFreeBookingsTracker={showFreeBookingsTracker}
      />
    );
  }

  // No V1 fallback (e.g. legacy user turned off availability after setting it): prompt to turn on availability
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-md">
        {showFreeBookingsTracker && (
          <FreeBookingsTracker
            bookingsUsed={freeBookingsUsed}
            className="mb-4 justify-center"
          />
        )}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
            <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            Turn on your schedule to get bookings
          </h3>
          <p className="text-gray-400 text-sm mt-2 mx-auto leading-relaxed">
            Right now customers can&apos;t book because your schedule is off.
            Turn it on and set your hours. Then new bookings will show up here.
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
    </div>
  );
}
