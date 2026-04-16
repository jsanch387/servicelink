'use client';

import { GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React from 'react';
import type { AddOnDisplay, CustomerFormData } from '../types';

interface BookingSuccessProps {
  businessName: string;
  businessSlug: string;
  serviceName: string;
  serviceVariantLabel?: string;
  /** Base service price (in cents). */
  servicePriceCents?: number;
  /** Add-ons selected on the service details page. */
  selectedAddOns?: AddOnDisplay[];
  /** Total price including base service + add-ons. */
  totalPriceCents?: number;
  customer: CustomerFormData;
  date: string;
  time: string;
  isOwnerManualBooking?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  businessName,
  businessSlug,
  serviceName,
  serviceVariantLabel,
  servicePriceCents,
  selectedAddOns = [],
  totalPriceCents,
  customer,
  date,
  time,
  isOwnerManualBooking = false,
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

  const vehicleLine = formatVehicle(customer);

  return (
    <div className="flex flex-col w-full py-10 pb-16">
      {/* Green check */}
      <div className="self-center w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/25">
        <CheckIcon className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        You&apos;re booked
      </h2>
      <p className="self-center text-gray-400 text-sm mb-8 max-w-sm text-center">
        {isOwnerManualBooking ? (
          <>
            Your appointment has been created. Your customer will receive an
            email notification.
          </>
        ) : (
          <>Your appointment with {businessName} is confirmed. See you then!</>
        )}
      </p>

      {/* Details card */}
      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-emerald-500"
        showBlur={true}
        className="w-full mb-8"
      >
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            {isOwnerManualBooking ? 'Appointment' : 'Your booking'}
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Service</p>
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-semibold">{serviceName}</p>
                {serviceVariantLabel ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {serviceVariantLabel}
                  </p>
                ) : null}
              </div>
              {servicePriceCents != null && (
                <p className="text-sm text-gray-400">
                  {formatPrice(servicePriceCents)}
                </p>
              )}
            </div>
          </div>
          {selectedAddOns.length > 0 && (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Add-ons</p>
                <ul className="space-y-1">
                  {selectedAddOns.map(addOn => (
                    <li
                      key={addOn.id}
                      className="flex justify-between text-sm gap-2"
                    >
                      <span className="text-white min-w-0">
                        {addOn.name}
                        {addOn.durationMinutes != null &&
                        addOn.durationMinutes > 0 ? (
                          <span className="text-gray-500 block text-xs mt-0.5">
                            +{formatDurationMinutes(addOn.durationMinutes)}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-gray-400 shrink-0">
                        {formatPrice(addOn.priceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {totalPriceCents != null && totalPriceCents > 0 && (
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

          {vehicleLine && (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Vehicle</p>
                <p className="text-white font-medium">{vehicleLine}</p>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      <p className="self-center text-xs text-gray-500 text-center mb-6 max-w-sm">
        {isOwnerManualBooking ? (
          <>Payment details are saved with this appointment.</>
        ) : (
          <>Payment details will be shared in your booking confirmation.</>
        )}
      </p>

      <Link
        href={
          isOwnerManualBooking ? ROUTES.DASHBOARD.BOOKINGS : `/${businessSlug}`
        }
        className="self-center inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
      >
        {isOwnerManualBooking ? 'Go to bookings' : 'Back to profile'}
      </Link>
    </div>
  );
};
