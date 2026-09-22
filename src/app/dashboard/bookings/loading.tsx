/**
 * Loading state for Bookings page.
 * Matches the live list: status filter, cards, layout toggle, and New appointment bar.
 */

import { AvailabilityBookingsViewSkeleton } from '@/features/availability/booking/dashboard/AvailabilityBookingCardSkeleton';
import { CALENDAR_LIST_COLUMN_CLASS } from '@/features/availability/booking/dashboard/calendar/types';

export default function BookingsLoading() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-[#0f0f0f] text-white">
      <div className="min-h-0 flex-1 overflow-y-auto pb-36">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-10 md:px-6 lg:px-8 lg:py-10">
          <header
            className={`${CALENDAR_LIST_COLUMN_CLASS} mb-5 flex items-center gap-2 sm:mb-8 sm:gap-3`}
          >
            <div
              className="h-7 w-[8.5rem] shrink-0 animate-pulse rounded-lg bg-white/[0.06]"
              aria-hidden
            />
          </header>
          <AvailabilityBookingsViewSkeleton />
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 z-30 flex justify-center dashboard-sidebar-offset bottom-[calc(8rem+env(safe-area-inset-bottom))]"
        aria-hidden
      >
        <div className="h-9 w-[8.25rem] animate-pulse rounded-full bg-white/[0.07] sm:h-11 sm:w-[11rem]" />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-[#0f0f0f]/95 px-3 pt-3 backdrop-blur-md sm:px-4 md:px-6 dashboard-sidebar-offset lg:px-8 safe-area-pb"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto w-full max-w-lg lg:max-w-2xl">
          <div
            className="h-12 w-full shrink-0 animate-pulse rounded-xl bg-white/[0.08]"
            aria-hidden
          />
        </div>
      </div>
    </main>
  );
}
