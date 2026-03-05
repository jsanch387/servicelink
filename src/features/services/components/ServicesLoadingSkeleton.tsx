/**
 * Loading skeleton for the Services page.
 * Matches the layout: controls row + list of service cards.
 */

import React from 'react';

const cardClass =
  'rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 animate-pulse';

export const ServicesLoadingSkeleton: React.FC = () => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
        {/* Controls row skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="h-6 w-24 bg-white/10 rounded-lg" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-white/10 rounded-xl" />
            <div className="h-9 w-24 bg-white/10 rounded-xl" />
          </div>
        </div>

        {/* Service cards skeleton */}
        <ul className="space-y-4 list-none p-0 m-0">
          {[1, 2, 3].map(i => (
            <li key={i} className={cardClass}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="h-5 w-48 max-w-[200px] bg-white/10 rounded" />
                    <div className="h-6 w-14 bg-white/10 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-white/10 rounded" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-full max-w-[90%] bg-white/10 rounded" />
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-white/[0.08]">
                    <div className="h-9 w-20 bg-white/10 rounded-xl" />
                    <div className="h-9 w-16 bg-white/10 rounded-xl" />
                    <div className="ml-auto h-7 w-12 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};
