'use client';

import { GlassCard } from '@/components/shared';
import { CALENDAR_LIST_COLUMN_CLASS } from './calendar/types';

/**
 * Skeleton for a single V2 availability booking card.
 * Matches AvailabilityBookingCard: name + pill; service; vehicle + chevron row.
 */
export function AvailabilityBookingCardSkeleton() {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      showBlur={false}
      className="!p-4 sm:!p-5 animate-pulse"
    >
      <div className="flex w-full items-stretch gap-3 sm:gap-4">
        <div className="flex shrink-0 items-stretch gap-1 sm:gap-1.5">
          <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center text-center sm:w-[5rem]">
            <div className="h-4 w-12 rounded bg-white/10 sm:h-5 sm:w-14" />
            <div className="mt-1 h-2.5 w-6 rounded bg-white/5" />
          </div>
          <div
            className="w-px flex-shrink-0 self-stretch bg-white/10"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1 sm:pr-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="h-4 max-w-[12rem] flex-1 rounded bg-white/10 pt-0.5 sm:h-5" />
            <div className="h-5 w-16 shrink-0 rounded-md bg-white/10" />
          </div>
          <div className="mt-3 flex flex-col gap-0.5 sm:mt-3.5">
            <div className="h-3.5 max-w-[220px] rounded bg-white/5" />
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 max-w-[180px] flex-1 rounded bg-white/5" />
              <div className="h-5 w-5 shrink-0 rounded bg-white/5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

const CARD_COUNT = 4;

/**
 * Card stack for the bookings list loading state.
 * Sits in the same column as the live list.
 */
export function AvailabilityBookingsViewSkeleton() {
  return (
    <div className={`${CALENDAR_LIST_COLUMN_CLASS} space-y-3`}>
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <AvailabilityBookingCardSkeleton key={i} />
      ))}
    </div>
  );
}
