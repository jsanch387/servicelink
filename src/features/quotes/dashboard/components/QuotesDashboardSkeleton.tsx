'use client';

import React from 'react';

export const QuotesDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 pb-8 sm:space-y-4 sm:pb-10" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`quotes-skeleton-${i}`}
          className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-white/10 sm:w-52" />
              <div className="h-3 w-28 rounded bg-white/10 sm:w-36" />
              <div className="h-3 w-44 rounded bg-white/10 sm:w-56" />
            </div>
            <div className="h-5 w-5 rounded bg-white/10 sm:h-6 sm:w-6" />
          </div>
        </div>
      ))}
    </div>
  );
};
