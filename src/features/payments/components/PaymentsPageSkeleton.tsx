'use client';

import React from 'react';

const pulseCard =
  'rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse';

/**
 * Route-level skeleton for the Pro payments dashboard (toggle + Stripe + checkout + deposits).
 */
export const PaymentsPageSkeleton: React.FC = () => {
  return (
    <>
      <div className="mb-6 sm:mb-8 space-y-2">
        <div className="h-8 w-40 max-w-[60%] bg-white/10 rounded-lg" />
        <div className="h-4 w-full max-w-md bg-white/10 rounded" />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className={`${pulseCard} p-4 sm:px-8 sm:py-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-56 bg-white/10 rounded" />
              <div className="h-3 w-full max-w-sm bg-white/10 rounded" />
            </div>
            <div className="h-7 w-12 bg-white/10 rounded-full shrink-0 self-end sm:self-center" />
          </div>
        </div>

        <div className={`${pulseCard} p-4 sm:p-8`}>
          <div className="h-4 w-20 bg-white/10 rounded mb-2" />
          <div className="h-3 w-full max-w-lg bg-white/10 rounded mb-1" />
          <div className="h-3 w-full max-w-md bg-white/10 rounded mb-5" />
          <div className="h-10 w-full max-w-xs bg-white/10 rounded-xl" />
        </div>
      </div>

      <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
        <div className={`${pulseCard} p-4 sm:px-8 sm:pt-8 sm:pb-6`}>
          <div className="h-5 w-48 bg-white/10 rounded mb-2" />
          <div className="h-3 w-full max-w-md bg-white/10 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-[4.5rem] bg-white/[0.06] rounded-xl border border-white/[0.06]"
              />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="h-9 w-32 bg-white/10 rounded-xl" />
          </div>
        </div>

        <div className={`${pulseCard} p-4 sm:px-8 sm:pt-8 sm:pb-6`}>
          <div className="h-5 w-32 bg-white/10 rounded mb-2" />
          <div className="h-3 w-full max-w-sm bg-white/10 rounded mb-6" />
          <div className="h-14 bg-white/[0.06] rounded-2xl border border-white/[0.06] mb-6" />
          <div className="h-20 bg-white/[0.06] rounded-xl border border-white/[0.06] mb-6" />
          <div className="flex justify-end">
            <div className="h-9 w-32 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    </>
  );
};
