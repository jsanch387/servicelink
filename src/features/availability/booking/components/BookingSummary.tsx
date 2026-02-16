'use client';

import type { CustomerFormData } from '../types';
import React from 'react';

function formatAddress(customer: CustomerFormData): string {
  const parts = [
    customer.streetAddress,
    customer.unitApt.trim() ? customer.unitApt : null,
    [customer.city, customer.state, customer.zip].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ');
}

interface BookingSummaryProps {
  serviceName: string;
  serviceDurationMinutes: number;
  servicePriceCents?: number;
  date: string;
  time: string;
  customer: CustomerFormData;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  serviceName,
  serviceDurationMinutes,
  servicePriceCents,
  date,
  time,
  customer,
}) => {
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white tracking-tight">Review your booking</h2>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Service</p>
          <p className="text-white font-medium">{serviceName}</p>
          <p className="text-sm text-gray-400">
            {serviceDurationMinutes} min
            {servicePriceCents != null && (
              <> · ${(servicePriceCents / 100).toFixed(2)}</>
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date & time</p>
          <p className="text-white font-medium">{dateFormatted}</p>
          <p className="text-sm text-gray-400">{time}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contact</p>
          <p className="text-white font-medium">{customer.fullName}</p>
          <p className="text-sm text-gray-400">{customer.email}</p>
          <p className="text-sm text-gray-400">{customer.phone}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
          <p className="text-white font-medium">{formatAddress(customer)}</p>
        </div>

        {customer.notes.trim() && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-400">{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
