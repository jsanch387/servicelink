'use client';

import { BookingRequestPageClient } from './BookingRequestPageClient';
import { AvailabilityBookingPage, MOCK_WEEKLY_SCHEDULE } from '@/features/availability/booking';
import React from 'react';

interface BookFlowSwitchProps {
  useAvailabilityBooking: boolean;
  businessName: string;
  businessId: string;
  businessSlug: string;
  serviceName: string;
  servicePrice?: number;
}

/**
 * Renders either Availability Booking (date/time + form, no API) or
 * existing Request Booking flow based on feature flag.
 */
export function BookFlowSwitch({
  useAvailabilityBooking,
  businessName,
  businessId,
  businessSlug,
  serviceName,
  servicePrice,
}: BookFlowSwitchProps) {
  if (useAvailabilityBooking) {
    return (
      <AvailabilityBookingPage
        businessName={businessName}
        businessSlug={businessSlug}
        serviceName={serviceName || 'Booking'}
        serviceDurationMinutes={60}
        servicePriceCents={servicePrice}
        weeklySchedule={MOCK_WEEKLY_SCHEDULE}
        existingBookings={[]}
      />
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
