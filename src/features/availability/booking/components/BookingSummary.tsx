'use client';

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

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return phone;
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
          <p className="text-white font-medium">{serviceName}</p>
          <p className="text-sm text-gray-400">
            {formatDurationMinutes(serviceDurationMinutes)}
            {servicePriceCents != null && (
              <> · {formatPrice(servicePriceCents)}</>
            )}
          </p>
        </div>

        {selectedAddOns.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 tracking-wider mb-1">Add-ons</p>
            <ul className="space-y-1">
              {selectedAddOns.map(addOn => (
                <li key={addOn.id} className="flex justify-between text-sm">
                  <span className="text-white">{addOn.name}</span>
                  <span className="text-gray-400">
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
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Total</span>
                <span className="text-lg font-semibold text-white">
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
            {formatPhoneDisplay(customer.phone)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 tracking-wider mb-1">Address</p>
          <p className="text-white font-medium">{formatAddress(customer)}</p>
        </div>

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
