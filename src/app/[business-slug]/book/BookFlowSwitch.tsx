'use client';

import { BookingRequestPageClient } from './BookingRequestPageClient';
import { AvailabilityBookingPage } from '@/features/availability/booking';
import type { AddOnDisplay } from '@/features/availability/booking/types';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import React from 'react';

interface BookFlowSwitchProps {
  useAvailabilityBooking: boolean;
  /** When true, show "This business isn't accepting bookings yet" (new users with V2 off). */
  showNotAcceptingBookings: boolean;
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
  weeklySchedule?: WeeklySchedule | null;
  isOwnerManualBooking?: boolean;
}

/**
 * Renders V2 Availability Booking, V1 Request Booking, or "Not accepting bookings"
 * based on legacy_request_booking_enabled and business_availability.accept_bookings.
 */
export function BookFlowSwitch({
  useAvailabilityBooking,
  showNotAcceptingBookings,
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
  weeklySchedule,
  isOwnerManualBooking = false,
}: BookFlowSwitchProps) {
  if (useAvailabilityBooking) {
    const schedule = weeklySchedule ?? DEFAULT_SCHEDULE;
    return (
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
        servicePriceCents={servicePrice}
        weeklySchedule={schedule}
        isOwnerManualBooking={isOwnerManualBooking}
      />
    );
  }

  if (showNotAcceptingBookings) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-gray-300 text-base font-medium">
          This business isn&apos;t accepting bookings yet.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Check back later or contact them directly.
        </p>
      </div>
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
