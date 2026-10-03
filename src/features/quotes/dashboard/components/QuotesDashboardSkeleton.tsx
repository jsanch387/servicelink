'use client';

import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';

export const QuotesDashboardSkeleton: React.FC = () => {
  return (
    <div aria-hidden>
      <div className="mb-4 flex justify-end">
        <div className={`h-10 w-24 rounded-[10px] ${pulse}`} />
      </div>
      <div className="hidden overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <div className="flex gap-8 border-b border-white/10 px-4 py-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-3 w-16 ${pulse}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(row => (
          <div
            key={row}
            className="flex items-center gap-6 border-b border-white/5 px-4 py-4 last:border-0"
          >
            <div className={`h-4 w-36 ${pulse}`} />
            <div className={`h-4 w-28 ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
            <div className={`h-4 w-16 ${pulse}`} />
            <div className={`h-5 w-16 rounded-full ${pulse}`} />
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map(row => (
          <div
            key={row}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
          >
            <div className={`h-5 w-40 ${pulse}`} />
            <div className={`mt-3 h-4 w-full ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
