'use client';

import React from 'react';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/[0.08] ${className}`} aria-hidden />;
}

/** Loading skeleton for subscriber detail (matches page layout). */
export const OwnerSubscriberDetailSkeleton: React.FC = () => {
  return (
    <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
      <div
        className="mx-auto w-full max-w-2xl animate-pulse"
        aria-busy="true"
        aria-label="Loading subscriber"
      >
        <Pulse className="mb-5 h-5 w-28 rounded" />

        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-5">
          <div className="min-w-0 flex-1">
            <Pulse className="h-8 w-48 max-w-[75%] rounded-lg sm:h-9" />
            <Pulse className="mt-2.5 h-4 w-36 rounded" />
          </div>
          <Pulse className="h-9 w-9 shrink-0 rounded-lg" />
        </header>

        <section className="mt-6">
          <Pulse className="mb-2 h-4 w-12 rounded" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <Pulse className="h-4 w-44 rounded" />
                <Pulse className="h-3.5 w-full max-w-sm rounded" />
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Pulse className="h-9 w-28 rounded-lg" />
                <Pulse className="h-9 w-36 rounded-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <Pulse className="mb-2 h-4 w-16 rounded" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
            <Pulse className="h-9 w-40 rounded-lg" />
            <div className="mt-5 divide-y divide-white/[0.08] border-t border-white/[0.08]">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <Pulse className="h-3.5 w-16 rounded" />
                  <Pulse className="h-3.5 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5">
          <Pulse className="mb-2 h-4 w-16 rounded" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-2">
            {[1, 2].map(i => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-white/[0.08] py-3 last:border-0"
              >
                <Pulse className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Pulse className="h-3 w-12 rounded" />
                  <Pulse className="h-3.5 w-40 max-w-[70%] rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <Pulse className="mb-2 h-4 w-14 rounded" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <Pulse className="h-24 w-full rounded-xl" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <Pulse className="h-3 w-40 max-w-[50%] rounded" />
              <Pulse className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
