import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';

export const MarketingPageSkeleton: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className={`h-9 w-40 ${pulse}`} />
            <div className={`mt-2 h-4 w-80 max-w-full ${pulse}`} />
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className={`h-12 w-full sm:w-48 rounded-[10px] ${pulse}`} />
            <div className={`h-12 w-full sm:w-36 rounded-[10px] ${pulse}`} />
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-white/10">
            <nav className="-mb-px flex space-x-8">
              <div className={`h-4 w-28 mb-4 ${pulse}`} />
              <div className={`h-4 w-20 mb-4 ${pulse}`} />
            </nav>
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] md:block">
            <div className="border-b border-white/10 px-4 py-3 flex gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`h-3 w-20 ${pulse}`} />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map(row => (
              <div
                key={row}
                className="border-b border-white/5 px-4 py-4 flex items-center gap-6 last:border-0"
              >
                <div className={`h-4 w-32 ${pulse}`} />
                <div className={`h-4 w-24 ${pulse}`} />
                <div className={`h-6 w-16 rounded-full ${pulse}`} />
                <div className={`h-4 w-28 ${pulse}`} />
                <div className={`h-4 w-36 ${pulse}`} />
                <div className={`h-6 w-12 rounded-full ${pulse}`} />
                <div className="flex gap-1">
                  <div className={`h-8 w-8 rounded ${pulse}`} />
                  <div className={`h-8 w-8 rounded ${pulse}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Card Skeleton */}
          <div className="space-y-3 md:hidden">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="animate-pulse space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 w-32 rounded bg-white/10" />
                    <div className="h-3 w-48 max-w-full rounded bg-white/10" />
                  </div>
                  <div className="h-6 w-16 shrink-0 rounded-full bg-white/10" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="h-6 w-20 rounded bg-white/10" />
                  <div className="flex gap-2">
                    <div className="h-8 w-16 rounded-[10px] bg-white/10" />
                    <div className="h-8 w-16 rounded-[10px] bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
