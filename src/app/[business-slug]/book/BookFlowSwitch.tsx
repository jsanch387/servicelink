'use client';

import { Button } from '@/components/shared';
import { ROUTES, type PublicBookingFlowLocale } from '@/constants/routes';
import { AvailabilityBookingPage } from '@/features/availability/booking';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import type {
  AddOnDisplay,
  PublicBookingPaymentSettings,
  TimeOffInterval,
} from '@/features/availability/booking/types';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { FREE_BOOKINGS_LIMIT } from '@/features/pricing';
import { Suspense } from 'react';
import { BookingRequestPageClient } from './BookingRequestPageClient';

interface BookFlowSwitchProps {
  useAvailabilityBooking: boolean;
  /** When true, show "This business isn't accepting bookings yet" (new users with V2 off). */
  showNotAcceptingBookings: boolean;
  /** Free-tier lifetime booking cap reached (owner messaging differs from bookings-off). */
  reachedFreeCap?: boolean;
  businessName: string;
  businessId: string;
  businessSlug: string;
  /** When true, booking details form includes vehicle year/make/model. */
  showVehicleFields?: boolean;
  serviceId?: string;
  /** Comma-separated add-on IDs from service details page. */
  addOnIds?: string;
  /** Resolved add-on objects (from server fetch). Used instead of addOnIds when available. */
  selectedAddOns?: AddOnDisplay[];
  serviceName: string;
  servicePrice?: number;
  serviceDurationMinutes?: number;
  /** Custom owner job notes prefilled into the booking details form. */
  initialCustomerNotes?: string;
  /** Label for chosen multi-price option (shown in calendar step). */
  selectedPriceOptionLabel?: string;
  weeklySchedule?: WeeklySchedule | null;
  timeOffBlocks?: TimeOffInterval[];
  isOwnerManualBooking?: boolean;
  paymentSettings?: PublicBookingPaymentSettings | null;
  /** Leave calendar flow (step: schedule) — service details, profile, or dashboard. */
  exitCalendarFlowHref: string;
  exitCalendarFlowLabel: string;
  /** From server when URL has `checkout=success&session_id=…` after Stripe. */
  stripeCheckoutSessionId?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  serviceLocation: PublicBookingServiceLocation;
  /** Pre-selected mobile/shop from `/book/details` when business offers both. */
  initialCustomerServiceChoice?: 'mobile' | 'shop' | null;
  activeSale?: PublicActiveSale | null;
}

/**
 * Renders V2 Availability Booking, V1 Request Booking, or "Not accepting bookings"
 * (availability off, legacy rules, or free-tier lifetime booking cap). When
 * `showNotAcceptingBookings` is true, that state wins over the availability calendar.
 */
export function BookFlowSwitch({
  useAvailabilityBooking,
  showNotAcceptingBookings,
  reachedFreeCap = false,
  businessName,
  businessId,
  businessSlug,
  showVehicleFields = false,
  serviceId,
  addOnIds,
  selectedAddOns,
  serviceName,
  servicePrice,
  serviceDurationMinutes = 60,
  initialCustomerNotes,
  selectedPriceOptionLabel,
  weeklySchedule,
  timeOffBlocks = [],
  isOwnerManualBooking = false,
  paymentSettings = null,
  exitCalendarFlowHref,
  exitCalendarFlowLabel,
  stripeCheckoutSessionId = null,
  bookingFlowLocale = 'en',
  serviceLocation,
  initialCustomerServiceChoice = null,
  activeSale = null,
}: BookFlowSwitchProps) {
  const ui = publicBookingUi(bookingFlowLocale);

  if (showNotAcceptingBookings) {
    if (isOwnerManualBooking) {
      const title = reachedFreeCap
        ? ui.notAccepting.ownerFreeCapTitle
        : ui.notAccepting.ownerBookingsOffTitle;
      const body = reachedFreeCap
        ? ui.notAccepting.ownerFreeCapBody(FREE_BOOKINGS_LIMIT)
        : ui.notAccepting.ownerBookingsOffBody;

      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-base font-medium text-gray-300">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{body}</p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              href={ROUTES.DASHBOARD.BOOKINGS}
              variant="secondary"
              className="font-semibold"
            >
              {ui.notAccepting.ownerBackToBookings}
            </Button>
            {reachedFreeCap ? (
              <Button
                href={ROUTES.DASHBOARD.UPGRADE}
                variant="inverse"
                className="font-semibold"
              >
                {ui.notAccepting.ownerUpgradeCta}
              </Button>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-gray-300 text-base font-medium">
          {ui.notAccepting.title}
        </p>
        <p className="text-gray-500 text-sm mt-2">{ui.notAccepting.body}</p>
      </div>
    );
  }

  if (useAvailabilityBooking) {
    const schedule = weeklySchedule ?? DEFAULT_SCHEDULE;
    return (
      <Suspense fallback={<BookFlowLoadingState />}>
        <AvailabilityBookingPage
          businessName={businessName}
          businessId={businessId}
          businessSlug={businessSlug}
          showVehicleFields={showVehicleFields}
          serviceId={serviceId}
          addOnIds={addOnIds}
          selectedAddOns={selectedAddOns}
          serviceName={serviceName || 'Booking'}
          serviceDurationMinutes={serviceDurationMinutes}
          initialCustomerNotes={initialCustomerNotes}
          servicePriceCents={servicePrice}
          selectedPriceOptionLabel={selectedPriceOptionLabel}
          weeklySchedule={schedule}
          timeOffBlocks={timeOffBlocks}
          isOwnerManualBooking={isOwnerManualBooking}
          paymentSettings={paymentSettings}
          exitCalendarFlowHref={exitCalendarFlowHref}
          exitCalendarFlowLabel={exitCalendarFlowLabel}
          stripeCheckoutSessionId={stripeCheckoutSessionId}
          bookingFlowLocale={bookingFlowLocale}
          serviceLocation={serviceLocation}
          initialCustomerServiceChoice={initialCustomerServiceChoice}
          activeSale={activeSale}
        />
      </Suspense>
    );
  }

  return (
    <BookingRequestPageClient
      businessName={businessName}
      businessId={businessId}
      businessSlug={businessSlug}
      serviceName={serviceName}
      servicePrice={servicePrice}
    />
  );
}
