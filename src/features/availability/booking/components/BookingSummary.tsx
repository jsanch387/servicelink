'use client';

import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import React from 'react';
import type { AddOnDisplay, CustomerFormData } from '../types';
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
  time: string;
  customer: CustomerFormData;
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
  time,
  customer,
}) => {
  const totalMinutes = totalAppointmentMinutes ?? serviceDurationMinutes;
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      month: 'long',

      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white tracking-tight">
        Review your booking
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
        />

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">
            Date & time
          </p>
          <p className="text-white font-medium">{dateFormatted}</p>
          <p className="text-sm text-gray-400 mt-0.5">{time}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">Contact</p>
          <p className="text-white font-medium">{customer.fullName}</p>
          <p className="text-sm text-gray-400">{customer.email}</p>
          <p className="text-sm text-gray-400">
            {formatPhoneUsDisplay(customer.phone)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">Address</p>
          <p className="text-white font-medium">{formatAddress(customer)}</p>
        </div>

        {formatVehicle(customer) && (
          <div>
            <p className="text-xs text-gray-500 tracking-wider mb-1">Vehicle</p>
            <p className="text-white font-medium">{formatVehicle(customer)}</p>
          </div>
        )}

        {customer.notes.trim() && (
          <div>
            <p className="text-xs text-gray-500 tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-400">{customer.notes}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Payment is collected in person. The provider will let you know their
        accepted payment methods.
      </p>
    </div>
  );
};
