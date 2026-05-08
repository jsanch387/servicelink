'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { AddOnDisplay, CustomerFormData } from '../types';
import { formatBookingWallTime } from '../utils/formatBookingWallTime';
import { BookingPriceBreakdown } from './BookingPriceBreakdown';

function formatAddress(customer: CustomerFormData): string {
  const parts = [
    customer.streetAddress,
    customer.unitApt.trim() ? customer.unitApt : null,
    [customer.city, customer.state, customer.zip].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ');
}

function formatVehicle(customer: CustomerFormData): string | null {
  const parts = [
    customer.vehicleYear?.trim() ? customer.vehicleYear.trim() : null,
    customer.vehicleMake?.trim() ? customer.vehicleMake.trim() : null,
    customer.vehicleModel?.trim() ? customer.vehicleModel.trim() : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

interface BookingSummaryProps {
  serviceName: string;
  serviceDurationMinutes: number;
  /** When set (e.g. base service + add-on time), shown as appointment length. */
  totalAppointmentMinutes?: number;
  servicePriceCents?: number;
  serviceVariantLabel?: string;
  /** Add-ons selected on the service details page. */
  selectedAddOns?: AddOnDisplay[];
  /** Total price including base service + add-ons. */
  totalPriceCents?: number;
  date: string;
  /** Local wall time `HH:mm` (24h); formatted for display using `bookingFlowLocale`. */
  startTimeHhmm: string;
  customer: CustomerFormData;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  serviceName,
  serviceDurationMinutes,
  totalAppointmentMinutes,
  servicePriceCents,
  serviceVariantLabel,
  selectedAddOns = [],
  totalPriceCents,
  date,
  startTimeHhmm,
  customer,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const totalMinutes = totalAppointmentMinutes ?? serviceDurationMinutes;
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(
    bcp47ForBookingLocale(bookingFlowLocale),
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
  const timeDisplay = formatBookingWallTime(startTimeHhmm, bookingFlowLocale);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white tracking-tight">
        {ui.calendar.reviewBooking}
      </h2>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <BookingPriceBreakdown
          serviceName={serviceName}
          serviceDurationMinutes={serviceDurationMinutes}
          servicePriceCents={servicePriceCents}
          serviceVariantLabel={serviceVariantLabel}
          selectedAddOns={selectedAddOns}
          totalBookingDurationMinutes={totalMinutes}
          totalPriceCents={totalPriceCents}
          serviceTitleTag="h3"
          bookingFlowLocale={bookingFlowLocale}
        />

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">
            {ui.common.dateAndTime}
          </p>
          <p className="text-white font-medium">{dateFormatted}</p>
          <p className="text-sm text-gray-400 mt-0.5">{timeDisplay}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">
            {ui.common.contact}
          </p>
          <p className="text-white font-medium">{customer.fullName}</p>
          <p className="text-sm text-gray-400">
            {customer.email.trim()
              ? customer.email.trim()
              : ui.common.emailNotProvided}
          </p>
          <p className="text-sm text-gray-400">
            {formatPhoneUsDisplay(customer.phone)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">
            {ui.common.address}
          </p>
          <p className="text-white font-medium">{formatAddress(customer)}</p>
        </div>

        {formatVehicle(customer) && (
          <div>
            <p className="text-xs text-gray-500 tracking-wider mb-1">
              {ui.common.vehicle}
            </p>
            <p className="text-white font-medium">{formatVehicle(customer)}</p>
          </div>
        )}

        {customer.notes.trim() && (
          <div>
            <p className="text-xs text-gray-500 tracking-wider mb-1">
              {ui.common.notes}
            </p>
            <p className="text-sm text-gray-400">{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
