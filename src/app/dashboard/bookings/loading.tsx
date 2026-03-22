/**
 * Loading state for Bookings page.
 * Uses V2 (availability) skeleton only so V2 users see one continuous loading state.
 * V1 content loads from server and appears when ready.
 */

import { AvailabilityBookingsViewSkeleton } from '@/features/availability/booking/dashboard/AvailabilityBookingCardSkeleton';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white w-full overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.05] px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 w-full">
        <div className="w-full text-left">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Bookings
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your appointments
          </p>
        </div>

        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 mt-4">
          {TABS.map(t => (
            <div
              key={t.id}
              className="rounded-[10px] px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold whitespace-nowrap flex-shrink-0 bg-white/[0.05] text-gray-500 border border-white/[0.06]"
            >
              {t.label}
            </div>
          ))}
        </div>
      </header>

      <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 max-w-xl lg:max-w-3xl mx-auto w-full">
        <AvailabilityBookingsViewSkeleton />
      </main>
    </div>
  );
}
