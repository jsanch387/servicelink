'use client';

import { GlassCard } from '@/components/shared';
import {
  BriefcaseIcon,
  ChevronRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useCallback } from 'react';
import type { AvailabilityBookingDisplay } from './types';

interface AvailabilityBookingCardProps {
  booking: AvailabilityBookingDisplay;
  onClick: () => void;
}

/** Time string like "2:30 PM" → { time: "2:30", period: "PM" } */
function parseTimeDisplay(timeStr: string): { time: string; period: string } {
  const upper = timeStr.toUpperCase();
  if (upper.endsWith(' AM')) {
    return { time: timeStr.slice(0, -3).trim(), period: 'AM' };
  }
  if (upper.endsWith(' PM')) {
    return { time: timeStr.slice(0, -3).trim(), period: 'PM' };
  }
  return { time: timeStr, period: '' };
}

/** Date string YYYY-MM-DD → "Feb 22" */
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function shortAddress(booking: AvailabilityBookingDisplay): string {
  const { address } = booking;
  return (
    address.street ||
    [address.city, address.state].filter(Boolean).join(', ') ||
    ''
  );
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
  const addressPreview = shortAddress(booking);
  const { time: timePart, period } = parseTimeDisplay(booking.time);
  const dateShort = formatDateShort(booking.date);

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
        <div className="flex items-stretch gap-4 sm:gap-5 min-h-[100px] w-full">
          {/* Left: Time & Date (centered) */}
          <div className="flex flex-col justify-center items-center flex-shrink-0 w-14 sm:w-16 text-center">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums leading-tight">
              {timePart}
            </span>
            <span className="text-sm font-normal text-white/90 mt-0.5">
              {period}
            </span>
            <span className="text-sm font-normal text-white mt-2 tracking-wide">
              {dateShort}
            </span>
          </div>

          {/* Vertical divider */}
          <div
            className="w-px flex-shrink-0 bg-white/10 self-stretch"
            aria-hidden
          />

          {/* Middle: Customer, Service, Address */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 py-0.5">
            <h3 className="font-bold text-white text-base sm:text-lg truncate">
              {booking.customerName}
            </h3>
            <div className="flex items-center gap-1.5 text-white/80 text-xs tracking-wider mt-0.5">
              <BriefcaseIcon className="h-3.5 w-3.5 flex-shrink-0 text-white/60" />
              <span>{booking.serviceName}</span>
            </div>
            {addressPreview && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm mt-1 min-w-0">
                <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{addressPreview}</span>
              </div>
            )}
          </div>

          {/* Right: Status top, Chevron bottom right */}
          <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
            <StatusPill status={booking.status} />
            <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 mt-auto" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
