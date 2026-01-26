/**
 * Loading State for Booking Request Page
 *
 * Shows a loading state while the booking page is being loaded
 */

import { LoadingSpinner } from '@/components/shared';

export default function BookingRequestLoading() {
  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header with Back Button Skeleton */}
      <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Form Container Skeleton */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="h-3 w-48 bg-neutral-800 rounded animate-pulse" />
            <div className="h-8 w-64 bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-neutral-800 rounded animate-pulse" />
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 bg-neutral-800 rounded animate-pulse" />
                <div className="h-12 w-full bg-neutral-800 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Button Skeleton */}
          <div className="h-12 w-full bg-neutral-800 rounded animate-pulse mt-6" />
        </div>
      </div>
    </div>
  );
}
