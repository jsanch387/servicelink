'use client';

import React from 'react';

function PulseBlock({ className }: { className: string }) {
  return <div className={`rounded bg-white/[0.08] ${className}`} aria-hidden />;
}

function ReviewListRowSkeleton() {
  return (
    <li>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:p-5">
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
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="flex items-start gap-3 sm:gap-4">
            <PulseBlock className="h-12 w-16 sm:h-14 sm:w-[4.5rem]" />
            <div className="flex flex-col gap-2 pt-1.5 sm:pt-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <PulseBlock key={i} className="h-4 w-4 rounded-sm" />
                ))}
              </div>
              <PulseBlock className="h-3.5 w-20" />
            </div>
          </div>
          <div className="w-full space-y-2 sm:max-w-[280px] sm:flex-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <PulseBlock className="h-3 w-3 shrink-0" />
                <PulseBlock className="h-2 min-w-0 flex-1 rounded-full" />
                <PulseBlock className="h-3 w-9 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          <PulseBlock className="h-9 w-14 rounded-full" />
          <PulseBlock className="h-9 w-[5.5rem] rounded-full" />
          <PulseBlock className="h-9 w-[4.75rem] rounded-full" />
        </div>
        <PulseBlock className="mt-3 h-3 w-40" />
      </div>

      <ul className="flex list-none flex-col gap-2 sm:gap-3">
        {[1, 2, 3].map(i => (
          <ReviewListRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
};
