'use client';

import React from 'react';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/[0.08] ${className}`} aria-hidden />;
}

function PlanCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Pulse className="h-5 w-36 rounded-md sm:w-44" />
        <div className="flex shrink-0 items-baseline gap-1.5">
          <Pulse className="h-7 w-16 rounded-md sm:h-8 sm:w-20" />
          <Pulse className="h-4 w-10 rounded" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pulse className="h-7 w-16 rounded-full" />
        <Pulse className="h-7 w-20 rounded-full" />
        <Pulse className="h-7 w-14 rounded-full" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Pulse className="h-4 w-32 rounded" />
        <Pulse className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

/**
 * Route-level skeleton for the owner Subscriptions dashboard.
 */
export const OwnerSubscriptionsSkeleton: React.FC = () => {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div
          className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
          aria-busy="true"
          aria-label="Loading subscriptions"
        >
          <div className="mb-8 flex animate-pulse flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Pulse className="h-8 w-44 max-w-[60%] rounded-lg sm:h-9 sm:w-52" />
              <Pulse className="h-4 w-full max-w-md rounded" />
            </div>
            <Pulse className="h-9 w-full rounded-xl sm:w-36" />
          </div>

          <div className="animate-pulse space-y-5">
            <Pulse className="h-11 w-52 rounded-xl" />

            <Pulse className="h-4 w-48 rounded" />

            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <PlanCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
