/**
 * DashboardLoadingState - Skeleton for main Dashboard page
 * Matches DashboardContent: header + link card + 3-card grid
 */

import React from 'react';

const cardClass =
  'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-6';

export const DashboardLoadingState: React.FC = () => {
  return (
    <main className="flex-1 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="h-8 sm:h-9 w-64 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-md mt-2 bg-white/10 rounded-lg animate-pulse" />
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Link card skeleton (large) */}
          <div className={`${cardClass} p-6 sm:p-8`}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-5 w-48 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-4 w-full max-w-sm bg-white/10 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="mt-6 flex rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="h-12 w-20 bg-white/5 flex-shrink-0" />
              <div className="flex-1 h-12 bg-white/5 animate-pulse" />
            </div>
            <div className="mt-4 h-11 w-28 bg-white/10 rounded-xl animate-pulse" />
          </div>

          {/* 3-card grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={cardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse flex-shrink-0" />
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-10 w-16 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-4" />
                <div className="h-9 w-full bg-white/10 rounded-lg animate-pulse mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardLoadingState;
