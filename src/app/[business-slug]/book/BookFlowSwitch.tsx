'use client';

import { BookingRequestPageClient } from './BookingRequestPageClient';
import { AvailabilityBookingPage } from '@/features/availability/booking';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import React from 'react';

interface BookFlowSwitchProps {
  useAvailabilityBooking: boolean;
  businessName: string;
  businessId: string;
  businessSlug: string;
  serviceId?: string;
  serviceName: string;
  servicePrice?: number;
  serviceDurationMinutes?: number;
  weeklySchedule?: WeeklySchedule | null;
}

/**
 * Renders V2 Availability Booking (calendar + form) or V1 Request Booking
 * based on business_availability.accept_bookings for this business.
 */
export function BookFlowSwitch({
  useAvailabilityBooking,
  businessName,
  businessId,
  businessSlug,
  serviceId,
  serviceName,
  servicePrice,
  serviceDurationMinutes = 60,
  weeklySchedule,
}: BookFlowSwitchProps) {
  if (useAvailabilityBooking) {
    const schedule = weeklySchedule ?? DEFAULT_SCHEDULE;
    return (
      <AvailabilityBookingPage
        businessName={businessName}
        businessId={businessId}
        businessSlug={businessSlug}
        serviceId={serviceId}
        serviceName={serviceName || 'Booking'}
        serviceDurationMinutes={serviceDurationMinutes}
        servicePriceCents={servicePrice}
        weeklySchedule={schedule}
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
