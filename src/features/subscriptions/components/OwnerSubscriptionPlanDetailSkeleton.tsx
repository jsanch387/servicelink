'use client';

import React from 'react';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/[0.08] ${className}`} aria-hidden />;
}

/** Route-level skeleton for plan detail. */
export const OwnerSubscriptionPlanDetailSkeleton: React.FC = () => {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div
        className="mx-auto w-full min-w-0 max-w-2xl animate-pulse"
        aria-busy="true"
        aria-label="Loading plan"
      >
        <Pulse className="mb-6 h-5 w-28 rounded" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Pulse className="h-8 w-56 max-w-[80%] rounded-lg sm:h-9" />
            <Pulse className="mt-2 h-4 w-36 rounded" />
          </div>
          <div className="flex gap-1.5">
            <Pulse className="h-8 w-[4.25rem] rounded-md" />
            <Pulse className="h-8 w-[5rem] rounded-md" />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <Pulse className="h-4 w-16 rounded" />
            </div>
            <div className="divide-y divide-white/[0.06]">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <Pulse className="h-4 w-24 rounded" />
                  <Pulse className="h-5 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <Pulse className="h-4 w-24 rounded" />
            </div>
            <div className="space-y-3 px-5 py-5 sm:px-6">
              <Pulse className="h-3.5 w-full rounded" />
              <Pulse className="h-3.5 w-[92%] rounded" />
              <Pulse className="h-3.5 w-[70%] rounded" />
              <div className="space-y-2.5 pt-2">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Pulse className="h-4 w-4 shrink-0 rounded-full" />
                    <Pulse className="h-3.5 w-40 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <Pulse className="h-4 w-24 rounded" />
            </div>
            <div className="flex flex-col items-center px-5 py-8 sm:px-6">
              <Pulse className="h-4 w-36 rounded" />
              <Pulse className="mt-2 h-3.5 w-56 max-w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
