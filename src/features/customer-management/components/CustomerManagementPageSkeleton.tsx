import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';

export const CustomerManagementPageSkeleton: React.FC = () => {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <div className={`h-8 w-40 max-w-full ${pulse}`} />
        <div className={`mt-2 h-4 w-72 max-w-full ${pulse}`} />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className={`h-11 w-full rounded-xl sm:max-w-sm ${pulse}`} />
        <div className={`h-10 w-24 rounded-[10px] ${pulse}`} />
      </div>

      <div className="hidden md:block rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-3 w-16 ${pulse}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(row => (
          <div
            key={row}
            className="px-4 py-4 border-b border-white/5 last:border-0 flex items-center gap-6"
          >
            <div className={`h-4 w-36 ${pulse}`} />
            <div className={`h-4 w-28 ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
            <div className={`h-4 w-16 ${pulse}`} />
            <div className={`h-6 w-14 rounded-full ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
          </div>
        ))}
      </div>

      <div className="md:hidden space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4 animate-pulse"
          >
            <div className="flex justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-white/10 rounded" />
                <div className="h-3 w-full max-w-[220px] bg-white/10 rounded" />
              </div>
              <div className="h-5 w-5 bg-white/10 rounded shrink-0" />
            </div>
            <div className="h-3 w-full bg-white/10 rounded" />
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
