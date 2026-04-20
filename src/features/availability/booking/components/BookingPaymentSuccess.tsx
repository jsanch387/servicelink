'use client';

import { GlassCard } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import type { AddOnDisplay } from '../types';

function formatMoney(cents: number, currency: string): string {
  const safeCents = Number.isFinite(cents) ? Math.max(0, cents) : 0;
  const safeCurrency = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: safeCurrency,
  }).format(safeCents / 100);
}

function formatLinePrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateDisplay(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimeDisplay(timeValue: string): string {
  const parts = timeValue.split(':').map(Number);
  const h = Number.isFinite(parts[0]) ? parts[0] : 0;
  const m = Number.isFinite(parts[1]) ? parts[1] : 0;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${`${m}`.padStart(2, '0')} ${ampm}`;
}

/** Stored name may be `Service — Option` (same as webhook / createBooking). */
function splitStoredServiceName(stored: string): {
  title: string;
  variant?: string;
} {
  const parts = stored.split(/\s+—\s+/);
  if (parts.length >= 2) {
    return {
      title: parts[0]?.trim() || stored,
      variant: parts.slice(1).join(' — ').trim() || undefined,
    };
  }
  return { title: stored.trim() || stored };
}

function formatVehicleLine(params: {
  year?: string | null;
  make?: string | null;
  model?: string | null;
}): string | null {
  const parts = [
    params.year?.trim() || null,
    params.make?.trim() || null,
    params.model?.trim() || null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

export function BookingPaymentSuccess({
  businessName,
  businessSlug,
  serviceName,
  scheduledDate,
  startTime,
  currency,
  paidOnlineAmountCents,
  remainingAmountCents,
  paymentStatus,
  totalAmountCents,
  durationMinutes,
  servicePriceCents,
  selectedAddOns = [],
  customerVehicleYear,
  customerVehicleMake,
  customerVehicleModel,
}: {
  businessName: string;
  businessSlug: string;
  serviceName: string;
  scheduledDate: string;
  startTime: string;
  currency: string;
  paidOnlineAmountCents: number;
  remainingAmountCents: number;
  paymentStatus: string;
  totalAmountCents: number;
  durationMinutes: number | null;
  servicePriceCents: number | null;
  selectedAddOns?: AddOnDisplay[];
  customerVehicleYear?: string | null;
  customerVehicleMake?: string | null;
  customerVehicleModel?: string | null;
}) {
  const paidTitle =
    paymentStatus === 'paid_full' ? 'Payment received' : 'Deposit received';
  const heroSubtitle =
    paymentStatus === 'paid_full'
      ? `Your appointment with ${businessName} is confirmed and paid in full through ServiceLink.`
      : `Your appointment with ${businessName} is confirmed. Your deposit was received through ServiceLink; the rest is due later as agreed with your provider.`;

  const { title: serviceTitle, variant: serviceVariant } =
    splitStoredServiceName(serviceName);
  const vehicleLine = formatVehicleLine({
    year: customerVehicleYear,
    make: customerVehicleMake,
    model: customerVehicleModel,
  });
  const dateFormatted = formatDateDisplay(scheduledDate);
  const timeLabel = formatTimeDisplay(startTime);
  const safeTotal =
    Number.isFinite(totalAmountCents) && totalAmountCents > 0
      ? totalAmountCents
      : null;

  return (
    <div className="flex flex-col w-full py-10 pb-16">
      <div className="self-center w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/25">
        <CheckIcon className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        {paidTitle}
      </h2>
      <p className="self-center text-gray-400 text-sm mb-8 max-w-md text-center px-2">
        {heroSubtitle}
      </p>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-emerald-500"
        showBlur={true}
        className="w-full mb-8"
      >
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Your booking
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Service</p>
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-semibold">{serviceTitle}</p>
                {serviceVariant ? (
                  <p className="text-xs text-gray-500 mt-1">{serviceVariant}</p>
                ) : null}
              </div>
              {servicePriceCents != null && servicePriceCents > 0 && (
                <p className="text-sm text-gray-400 shrink-0">
                  {formatLinePrice(servicePriceCents)}
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
                        {formatLinePrice(addOn.priceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {safeTotal != null && (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-white">Total</p>
                <p className="text-lg font-semibold text-white">
                  {formatMoney(safeTotal, currency)}
                </p>
              </div>
            </>
          )}

          <div className="h-px bg-white/10" />
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              ServiceLink payment
            </p>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-300">Paid now</span>
              <span className="text-white font-semibold tabular-nums">
                {formatMoney(paidOnlineAmountCents, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm mt-2">
              <span className="text-gray-300">Remaining</span>
              <span className="text-white font-semibold tabular-nums">
                {formatMoney(remainingAmountCents, currency)}
              </span>
            </div>
          </div>

          <div className="h-px bg-white/10" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Date</p>
            <p className="text-white font-medium">{dateFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Time</p>
            <p className="text-white font-medium">{timeLabel}</p>
          </div>
          {durationMinutes != null && durationMinutes > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Duration</p>
              <p className="text-white font-medium">
                {formatDurationMinutes(durationMinutes)}
              </p>
            </div>
          )}

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

      <p className="self-center text-xs text-gray-500 text-center mb-6 max-w-sm px-2">
        A confirmation email was sent with these details. If you paid by card,
        Stripe may send a receipt as well.
      </p>

      <Link
        href={`/${businessSlug}`}
        className="self-center inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
      >
        Back to profile
      </Link>
    </div>
  );
}
