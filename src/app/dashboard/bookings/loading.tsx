/**
 * Loading State for Bookings Page
 * Shows skeleton UI while booking data is being fetched
 */

import { GlassCard } from '@/components/shared';

export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white w-full overflow-x-hidden">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.05] px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 w-full">
        <div className="max-w-xl lg:max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <div className="h-7 sm:h-8 w-32 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
          </div>

          {/* Filter Buttons Skeleton */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-8 sm:h-10 w-20 sm:w-24 bg-white/5 rounded-xl animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </header>

      <main className="px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 max-w-xl lg:max-w-7xl mx-auto w-full">
        {/* Information Banner Skeleton */}
        <div className="mb-4 sm:mb-5">
          <div className="bg-white/5 border-l-4 border-orange-500/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-orange-500/20 rounded-full animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="h-4 sm:h-5 w-full max-w-md bg-white/5 rounded animate-pulse mb-2" />
                <div className="h-3 w-full max-w-sm bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Count Skeleton */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
          <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Booking Cards Skeleton */}
        <div className="pb-20 sm:pb-24 w-full">
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <BookingRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Skeleton component for a single booking row
 * Matches the structure of BookingRow component
 */
function BookingRowSkeleton() {
  return (
    <GlassCard
      blurColor="bg-orange-500"
      rounded="rounded-2xl"
      className="mb-3 bg-white/[0.02] border-white/[0.06]"
      padding="none"
    >
      {/* Primary Row Skeleton */}
      <div className="p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4">
        {/* Main Content Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Customer Name Skeleton */}
            <div className="h-5 sm:h-6 w-32 sm:w-40 bg-white/10 rounded animate-pulse" />
            {/* Status Dot Skeleton */}
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/30 animate-pulse shrink-0" />
          </div>
          {/* Service Name & Price Skeleton */}
          <div className="h-3 sm:h-4 w-48 sm:w-56 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Right: Date/Time Skeleton */}
        <div className="text-right shrink-0">
          <div className="h-4 sm:h-5 w-16 bg-white/10 rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Chevron Skeleton */}
        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/5 rounded animate-pulse shrink-0" />
      </div>
    </GlassCard>
  );
}
