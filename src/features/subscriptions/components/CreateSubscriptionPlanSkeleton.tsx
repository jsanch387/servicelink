'use client';

import React from 'react';

function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/[0.08] ${className}`} aria-hidden />;
}

/** Route-level skeleton for create-plan wizard. */
export const CreateSubscriptionPlanSkeleton: React.FC = () => {
  return (
    <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div
        className="mx-auto w-full min-w-0 max-w-6xl"
        aria-busy="true"
        aria-label="Loading create plan"
      >
        <Pulse className="mb-6 h-5 w-28 animate-pulse rounded" />

        <div className="mx-auto w-full max-w-xl animate-pulse pt-6 sm:pt-10">
          <div className="mb-6 flex gap-1.5">
            {[1, 2, 3].map(i => (
              <Pulse key={i} className="h-1.5 flex-1 rounded-full" />
            ))}
          </div>

          <Pulse className="h-8 w-56 max-w-[80%] rounded-lg sm:h-9" />
          <Pulse className="mt-2 h-4 w-full max-w-sm rounded" />

          <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="space-y-2">
              <Pulse className="h-4 w-24 rounded" />
              <Pulse className="h-12 w-full rounded-xl" />
            </div>
            <Pulse className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
};
