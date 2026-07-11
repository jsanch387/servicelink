/**
 * BusinessProfileLoadingState - Minimal skeleton for public + dashboard booking link.
 * Matches BusinessProfileView: cover, header, tabs, service cards (no category row).
 */

import React from 'react';

const bar = 'rounded bg-white/[0.06] animate-pulse';
const SERVICE_SKELETON_COUNT = 4;

function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`h-5 w-36 max-w-[55%] ${bar}`} />
        <div className={`h-6 w-14 shrink-0 ${bar}`} />
      </div>
      <div className="my-3 border-t border-white/[0.04]" />
      <div className="mb-4 min-h-[3.5rem] space-y-2">
        <div className={`h-3 w-full ${bar}`} />
        <div className={`h-3 w-4/5 ${bar}`} />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className={`h-3 w-16 ${bar}`} />
        <div className={`h-4 w-12 ${bar}`} />
      </div>
    </div>
  );
}

export const BusinessProfileLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto">
        <div className={`relative h-44 sm:h-56 md:h-60 w-full ${bar}`} />

        <div className="relative z-10 -mt-14 flex flex-col items-center px-4 sm:px-8 text-center">
          <div
            className={`mb-5 h-28 w-28 rounded-[1.75rem] sm:h-32 sm:w-32 ${bar} ring-1 ring-white/10`}
          />
          <div className={`mb-2 h-7 w-48 max-w-[80%] ${bar}`} />
          <div className={`h-4 w-32 ${bar}`} />
        </div>

        <div className="mt-8 border-b border-white/[0.06] px-4 sm:px-8">
          <div className="flex gap-6 pb-3">
            <div className={`h-4 w-16 ${bar}`} />
            <div className={`h-4 w-14 ${bar}`} />
            <div className={`h-4 w-10 ${bar}`} />
          </div>
        </div>

        <div className="space-y-4 px-4 py-6 sm:px-8 sm:py-8">
          {Array.from({ length: SERVICE_SKELETON_COUNT }, (_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileLoadingState;
