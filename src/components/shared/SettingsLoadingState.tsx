/**
 * SettingsLoadingState - Skeleton for Settings page
 * Matches the Settings content layout: header + Custom link + Support
 */

import React from 'react';

const cardClass =
  'rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8';

export const SettingsLoadingState: React.FC = () => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Page header skeleton */}
        <div className="mb-10">
          <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-64 mt-2 bg-white/10 rounded-lg animate-pulse" />
        </div>

        <div className="space-y-8">
          {/* Custom link card skeleton */}
          <div className={cardClass}>
            <div className="h-4 w-28 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-3 w-full max-w-md mt-2 bg-white/10 rounded-lg animate-pulse" />
            <div className="mt-6 flex rounded-xl border border-white/10 overflow-hidden">
              <div className="h-12 w-24 bg-white/5 rounded-l-xl" />
              <div className="flex-1 h-12 bg-white/5 animate-pulse" />
            </div>
            <div className="h-11 w-32 mt-4 bg-white/10 rounded-xl animate-pulse" />
          </div>

          {/* Support card skeleton */}
          <div className={cardClass}>
            <div className="h-4 w-20 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-3 w-full max-w-sm mt-2 bg-white/10 rounded-lg animate-pulse" />
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 w-full sm:w-80">
              <div className="h-9 w-9 rounded-lg bg-white/10 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsLoadingState;
