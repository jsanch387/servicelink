/**
 * Loading state for Bookings page.
 * Uses V2 (availability) skeleton only so V2 users see one continuous loading state.
 * V1 content loads from server and appears when ready.
 */

import { AvailabilityBookingsViewSkeleton } from '@/features/availability/booking/dashboard/AvailabilityBookingCardSkeleton';

export default function BookingsLoading() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-[#0f0f0f] text-white">
      <div className="min-h-0 flex-1 overflow-y-auto pb-36">
        <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-10 md:px-6 lg:max-w-3xl lg:px-8 lg:py-10">
          <header className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
            <div className="min-w-0 flex-1 text-left">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Bookings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your appointments
              </p>
            </div>
            <div
              className="mt-1 h-5 w-28 shrink-0 rounded bg-white/[0.08] animate-pulse sm:h-5 sm:w-32"
              aria-hidden
            />
          </header>
          <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
            <div className="h-10 w-44 max-w-full shrink rounded-xl bg-white/[0.06] animate-pulse" />
            <div className="h-10 w-10 shrink-0 rounded-[10px] bg-white/[0.06] animate-pulse md:h-10 md:w-40" />
          </div>
          <AvailabilityBookingsViewSkeleton />
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#0f0f0f]/95 px-3 pt-4 backdrop-blur-md sm:px-4 md:px-6 dashboard-sidebar-offset lg:px-8 safe-area-pb"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto w-full max-w-xl lg:max-w-3xl">
          <div
            className="h-12 w-full shrink-0 rounded-xl bg-white/[0.08] animate-pulse"
            aria-hidden
          />
        </div>
      </div>
    </main>
  );
}
