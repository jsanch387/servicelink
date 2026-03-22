'use client';

import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import React from 'react';
import type { AddOnDisplay, CustomerFormData } from '../types';
import { formatDurationMinutes } from '../utils/formatDuration';

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
  servicePriceCents?: number;
  /** Add-ons selected on the service details page. */
  selectedAddOns?: AddOnDisplay[];
  /** Total price including base service + add-ons. */
  totalPriceCents?: number;
  date: string;
  time: string;
  customer: CustomerFormData;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  serviceName,
  serviceDurationMinutes,
  servicePriceCents,
  selectedAddOns = [],
  totalPriceCents,
  date,
  time,
  customer,
}) => {
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
        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">Service</p>
          <div className="flex justify-between gap-3 items-start">
            <div className="min-w-0">
              <p className="text-white font-medium">{serviceName}</p>
              <p className="text-sm text-gray-400">
                {formatDurationMinutes(serviceDurationMinutes)}
              </p>
            </div>
            {servicePriceCents != null && (
              <span className="text-sm text-gray-400 shrink-0 tabular-nums text-right">
                {formatPrice(servicePriceCents)}
              </span>
            )}
          </div>
        </div>

        {selectedAddOns.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 tracking-wider mb-1">Add-ons</p>
            <ul className="space-y-1">
              {selectedAddOns.map(addOn => (
                <li
                  key={addOn.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-white min-w-0">{addOn.name}</span>
                  <span className="text-gray-400 shrink-0 tabular-nums text-right">
                    {formatPrice(addOn.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedAddOns.length > 0 &&
          totalPriceCents != null &&
          totalPriceCents > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm font-medium text-white">Total</span>
                <span className="text-lg font-semibold text-white tabular-nums text-right">
                  {formatPrice(totalPriceCents)}
                </span>
              </div>
            </div>
          )}

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">
            Date & time
          </p>
          <p className="text-white font-medium">{dateFormatted}</p>
          <p className="text-sm text-gray-400">{time}</p>
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
