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
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div
        className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col"
        aria-busy="true"
        aria-label="Loading subscriptions"
      >
        <div className="animate-pulse shrink-0 space-y-2">
          <Pulse className="h-8 w-44 max-w-[60%] rounded-lg sm:h-9 sm:w-52" />
          <Pulse className="h-4 w-full max-w-md rounded" />
        </div>

        <div className="mt-6 animate-pulse space-y-5 sm:mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Pulse className="h-11 w-52 rounded-xl" />
            <Pulse className="h-9 w-full rounded-xl sm:w-36" />
          </div>

          <Pulse className="h-4 w-48 rounded" />

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
