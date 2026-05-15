'use client';

import { GlassCard } from '@/components/shared';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useCallback } from 'react';
import type { AvailabilityBookingDisplay } from './types';
import { formatListCardTimeForBooking } from './utils/formatListCardTime';

interface AvailabilityBookingCardProps {
  booking: AvailabilityBookingDisplay;
  onClick: () => void;
}

function formatVehicleLine(booking: AvailabilityBookingDisplay): string | null {
  const parts = [
    booking.customerVehicleYear?.trim(),
    booking.customerVehicleMake?.trim(),
    booking.customerVehicleModel?.trim(),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

function serviceLineText(booking: AvailabilityBookingDisplay): string {
  const base = (booking.serviceName ?? '').trim() || 'Service';
  const addons = (booking.addonDetails ?? [])
    .map(a => (a.name ?? '').trim())
    .filter(Boolean);
  if (addons.length === 0) return base;
  return `${base} · ${addons.join(', ')}`;
}

function StatusPill({
  status,
}: {
  status: AvailabilityBookingDisplay['status'];
}) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 tracking-wide">
        <CheckCircleIcon className="h-3 w-3" />
        Confirmed
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 tracking-wide">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400 tracking-wide">
      Cancelled
    </span>
  );
}

export function AvailabilityBookingCard({
  booking,
  onClick,
}: AvailabilityBookingCardProps) {
  const vehicleLine = formatVehicleLine(booking);
  const servicesText = serviceLineText(booking);
  const timeLabel = formatListCardTimeForBooking(booking);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] rounded-2xl"
    >
      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        showBlur={false}
        className="!p-4 sm:!p-5"
      >
        <div className="flex w-full items-stretch gap-3 sm:gap-4">
          {/* Time + divider: narrow column + rule hugging the time */}
          <div className="flex shrink-0 items-stretch gap-1 sm:gap-1.5">
            <div className="flex w-[4.25rem] shrink-0 flex-col justify-center text-center sm:w-[4.5rem]">
              <span className="whitespace-nowrap text-[11px] font-bold leading-none tracking-tight text-white tabular-nums sm:text-xs sm:leading-none">
                {timeLabel}
              </span>
            </div>
            <div
              className="w-px flex-shrink-0 self-stretch bg-white/10"
              aria-hidden
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1 sm:pr-2">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <h3 className="min-w-0 flex-1 truncate pt-0.5 text-base font-bold leading-tight text-white sm:text-lg">
                {booking.customerName}
              </h3>
              <div className="shrink-0">
                <StatusPill status={booking.status} />
              </div>
            </div>

            <div className="mt-3 flex min-w-0 flex-col gap-0.5 text-sm leading-snug sm:mt-3.5">
              {vehicleLine ? (
                <>
                  <span className="min-w-0 text-white/80">{servicesText}</span>
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 text-white/70">
                      {vehicleLine}
                    </span>
                    <ChevronRightIcon
                      className="h-5 w-5 shrink-0 text-white/80 sm:h-6 sm:w-6"
                      aria-hidden
                    />
                  </div>
                </>
              ) : (
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-white/80">
                    {servicesText}
                  </span>
                  <ChevronRightIcon
                    className="h-5 w-5 shrink-0 text-white/80 sm:h-6 sm:w-6"
                    aria-hidden
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
