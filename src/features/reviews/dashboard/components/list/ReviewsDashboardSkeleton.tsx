'use client';

import React from 'react';

function PulseBlock({ className }: { className: string }) {
  return <div className={`rounded bg-white/[0.08] ${className}`} aria-hidden />;
}

function ReviewListRowSkeleton() {
  return (
    <li className="h-full">
      <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <PulseBlock className="h-4 w-32 sm:w-36" />
            <PulseBlock className="h-3 w-24" />
          </div>
          <div className="flex shrink-0 gap-0.5 pt-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <PulseBlock
                key={i}
                className="h-3.5 w-3.5 rounded-sm sm:h-4 sm:w-4"
              />
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2 sm:mt-4">
          <PulseBlock className="h-3.5 w-full" />
          <PulseBlock className="h-3.5 w-[92%]" />
          <PulseBlock className="h-3.5 w-[70%]" />
        </div>
        <PulseBlock className="mt-4 h-9 w-full rounded-xl sm:mt-5 sm:w-28" />
      </div>
    </li>
  );
}

/**
 * Single loading placeholder for the reviews dashboard (summary + filters + list).
 * Avoids showing the empty state or real summary while the first fetch is in flight.
 */
export const ReviewsDashboardSkeleton: React.FC = () => {
  return (
    <div
      className="animate-pulse space-y-4 pb-8 sm:space-y-6 sm:pb-10"
      aria-busy="true"
      aria-label="Loading reviews"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <PulseBlock className="h-9 w-24 rounded-lg" />
          <PulseBlock className="h-3 w-40" />
        </div>
      </div>

      <ul className="grid list-none grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-2 lg:gap-4">
        {[1, 2, 3].map(i => (
          <ReviewListRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
};
