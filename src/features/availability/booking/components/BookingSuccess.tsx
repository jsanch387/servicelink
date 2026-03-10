'use client';

import { GlassCard } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React from 'react';
import type { AddOnDisplay } from '../types';

interface BookingSuccessProps {
  businessName: string;
  businessSlug: string;
  serviceName: string;
  /** Add-ons selected on the service details page. */
  selectedAddOns?: AddOnDisplay[];
  /** Total price including base service + add-ons. */
  totalPriceCents?: number;
  date: string;
  time: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  businessName,
  businessSlug,
  serviceName,
  selectedAddOns = [],
  totalPriceCents,
  date,
  time,
}) => {
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <div className="flex flex-col items-center py-10 px-4 pb-16">
      {/* Green check */}
      <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/25">
        <CheckIcon className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        You&apos;re booked
      </h2>
      <p className="text-gray-400 text-sm mb-8 max-w-sm text-center">
        Your appointment with {businessName} is confirmed. See you then!
      </p>

      {/* Details card */}
      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-emerald-500"
        showBlur={true}
        className="w-full max-w-sm mb-8 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Your booking
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Service</p>
            <p className="text-white font-semibold">{serviceName}</p>
          </div>
          {selectedAddOns.length > 0 && (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Add-ons</p>
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
            </>
          )}
          {selectedAddOns.length > 0 &&
            totalPriceCents != null &&
            totalPriceCents > 0 && (
              <>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-white">Total</p>
                  <p className="text-lg font-semibold text-white">
                    {formatPrice(totalPriceCents)}
                  </p>
                </div>
              </>
            )}
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Date</p>
            <p className="text-white font-medium">{dateFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Time</p>
            <p className="text-white font-medium">{time}</p>
          </div>
        </div>
      </GlassCard>

      <p className="text-xs text-gray-500 text-center mb-6 max-w-sm">
        Payment is collected in person. The provider will let you know their
        accepted payment methods.
      </p>

      <Link
        href={`/${businessSlug}`}
        className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
      >
        Back to profile
      </Link>
    </div>
  );
};
