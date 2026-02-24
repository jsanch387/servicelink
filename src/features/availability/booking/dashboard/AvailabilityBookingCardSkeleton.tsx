'use client';

import { GlassCard } from '@/components/shared';

/**
 * Skeleton for a single V2 availability booking card.
 * Matches AvailabilityBookingCard layout: time/date left, customer/service/address middle, status/chevron right.
 */
export function AvailabilityBookingCardSkeleton() {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      showBlur={false}
      className="!p-4 sm:!p-5 animate-pulse"
    >
      <div className="flex items-stretch gap-4 sm:gap-5 min-h-[100px] w-full">
        {/* Left: Time & Date */}
        <div className="flex flex-col justify-center items-center flex-shrink-0 w-14 sm:w-16 text-center">
          <div className="h-7 sm:h-8 w-10 bg-white/10 rounded mb-1" />
          <div className="h-3 w-6 bg-white/5 rounded mt-0.5" />
          <div className="h-3 w-12 bg-white/5 rounded mt-2" />
        </div>

        <div
          className="w-px flex-shrink-0 bg-white/10 self-stretch"
          aria-hidden
        />

        {/* Middle: Customer, Service, Address */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 py-0.5">
          <div className="h-4 sm:h-5 w-32 sm:w-40 bg-white/10 rounded" />
          <div className="h-3 w-24 sm:w-28 bg-white/5 rounded" />
          <div className="h-3 w-36 sm:w-44 bg-white/5 rounded mt-0.5" />
        </div>

        {/* Right: Status pill + Chevron */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
          <div className="h-5 w-16 bg-white/10 rounded-full" />
          <div className="h-5 w-5 sm:h-6 sm:w-6 bg-white/5 rounded mt-auto" />
        </div>
      </div>
    </GlassCard>
  );
}

const CARD_COUNT = 4;

/**
 * Full loading skeleton for V2 availability bookings list.
 * Renders the same header/tabs as the real view with skeleton cards below.
 */
export function AvailabilityBookingsViewSkeleton() {
  return (
    <div className="space-y-3 pb-20 sm:pb-24">
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <AvailabilityBookingCardSkeleton key={i} />
      ))}
    </div>
  );
}
