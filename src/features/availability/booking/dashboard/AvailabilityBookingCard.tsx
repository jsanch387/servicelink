'use client';

import { GlassCard } from '@/components/shared';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useCallback } from 'react';
import { eventChipClass } from './calendar/eventStyles';
import type { AvailabilityBookingDisplay } from './types';
import { bookingListServiceTitle } from './utils/bookingCardServiceTitle';
import { listCardTimeParts } from './utils/formatListCardTime';

interface AvailabilityBookingCardProps {
  booking: AvailabilityBookingDisplay;
  onClick: () => void;
  assigneeLabel?: string | null;
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

function statusLabel(status: AvailabilityBookingDisplay['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Confirmed';
}

function StatusPill({
  status,
}: {
  status: AvailabilityBookingDisplay['status'];
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${eventChipClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function AvailabilityBookingCard({
  booking,
  onClick,
  assigneeLabel = null,
}: AvailabilityBookingCardProps) {
  const vehicleLine = formatVehicleLine(booking);
  const servicesText = bookingListServiceTitle(booking);
  const { clock, period } = listCardTimeParts(booking);

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
            <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center text-center sm:w-[5rem]">
              <span className="whitespace-nowrap text-base font-bold leading-none tracking-tight text-white tabular-nums sm:text-lg">
                {clock}
              </span>
              {period ? (
                <span className="mt-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white/65 sm:text-xs">
                  {period}
                </span>
              ) : null}
            </div>
            <div
              className="w-px flex-shrink-0 self-stretch bg-white/10"
              aria-hidden
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden py-0.5 pr-1 sm:pr-2">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <h3 className="min-w-0 flex-1 overflow-hidden pt-0.5 text-base font-bold leading-tight text-white sm:text-lg">
                <span className="block truncate">{booking.customerName}</span>
              </h3>
              <div className="flex shrink-0 items-center gap-1.5">
                {assigneeLabel ? (
                  <span className="inline-flex max-w-[7.5rem] truncate rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/70">
                    {assigneeLabel}
                  </span>
                ) : null}
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
