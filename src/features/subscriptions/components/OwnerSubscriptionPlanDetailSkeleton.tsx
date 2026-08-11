'use client';

import React from 'react';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/[0.08] ${className}`} aria-hidden />;
}

/** Route-level skeleton for plan detail. */
export const OwnerSubscriptionPlanDetailSkeleton: React.FC = () => {
  return (
    <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
      <div
        className="mx-auto w-full max-w-6xl animate-pulse"
        aria-busy="true"
        aria-label="Loading plan"
      >
        <Pulse className="mb-5 h-5 w-28 rounded" />

        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Pulse className="h-8 w-56 max-w-[80%] rounded-lg sm:h-9" />
            <Pulse className="mt-2 h-4 w-36 rounded" />
          </div>
          <div className="flex gap-2">
            <Pulse className="h-9 w-[4.5rem] rounded-md" />
            <Pulse className="h-9 w-[5.25rem] rounded-md" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:gap-8">
          <aside className="space-y-5">
            <section>
              <Pulse className="mb-3 h-4 w-16 rounded" />
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="divide-y divide-white/[0.06]">
                  {[1, 2].map(i => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <Pulse className="h-3.5 w-24 rounded" />
                      <Pulse className="h-3.5 w-16 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <Pulse className="mb-3 h-4 w-24 rounded" />
              <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5">
                <Pulse className="h-3.5 w-full rounded" />
                <Pulse className="h-3.5 w-[92%] rounded" />
                <Pulse className="h-3.5 w-[70%] rounded" />
                <Pulse className="mt-1 h-3.5 w-40 rounded" />
                <Pulse className="h-3.5 w-44 rounded" />
              </div>
            </section>
          </aside>

          <section>
            <Pulse className="mb-3 h-4 w-24 rounded" />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="space-y-0 divide-y divide-white/5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Pulse className="h-3.5 w-28 rounded" />
                    <Pulse className="hidden h-3 w-24 rounded sm:block" />
                    <Pulse className="ml-auto h-3 w-14 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
