/**
 * Loading state for Bookings page.
 * Matches the live list: heading, layout toggle, and table rows.
 */

import { CalendarListSkeleton } from '@/features/availability/booking/dashboard/calendar/CalendarSkeletons';

export default function BookingsLoading() {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden text-white">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/[0.06]" />
            </div>
            <div className="h-9 w-full animate-pulse rounded-lg bg-white/[0.08] sm:w-40" />
          </header>
          <div className="mb-4 flex items-center justify-between">
            <div className="h-10 w-44 animate-pulse rounded-[10px] bg-white/[0.06]" />
            <div className="h-10 w-24 animate-pulse rounded-[10px] bg-white/[0.06]" />
          </div>
          <CalendarListSkeleton />
        </div>
      </div>
    </main>
  );
}
