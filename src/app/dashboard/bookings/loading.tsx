/**
 * Loading state for Bookings page.
 * Uses V2 (availability) skeleton only so V2 users see one continuous loading state.
 * V1 content loads from server and appears when ready.
 */

import { AvailabilityBookingsViewSkeleton } from '@/features/availability/booking/dashboard/AvailabilityBookingCardSkeleton';

export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white w-full overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.05] px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Bookings
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage your appointments
            </p>
          </div>
          <div
            className="h-10 w-full shrink-0 rounded-xl bg-white/[0.08] animate-pulse sm:mt-0.5 sm:w-40"
            aria-hidden
          />
        </div>
      </header>

      <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 max-w-xl lg:max-w-3xl mx-auto w-full">
        <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
          <div className="h-10 w-44 max-w-full shrink rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-10 w-10 shrink-0 rounded-[10px] bg-white/[0.06] animate-pulse md:h-10 md:w-40" />
        </div>
        <AvailabilityBookingsViewSkeleton />
      </main>
    </div>
  );
}
