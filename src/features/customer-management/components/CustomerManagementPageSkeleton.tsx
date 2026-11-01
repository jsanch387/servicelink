import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';

export const CustomerManagementPageSkeleton: React.FC = () => {
  return (
    <>
      <div className="mb-4 flex flex-col gap-x-2 gap-y-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={`h-11 w-full rounded-xl sm:max-w-sm ${pulse}`} />
        <div className="flex justify-start gap-2 sm:justify-end">
          <div className={`h-10 w-24 rounded-[10px] ${pulse}`} />
          <div className={`h-10 w-36 rounded-[10px] ${pulse}`} />
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] md:block">
        <div className="flex gap-8 border-b border-white/[0.08] px-5 py-3.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-3 w-16 ${pulse}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(row => (
          <div
            key={row}
            className="flex items-center gap-6 border-b border-white/[0.06] px-5 py-4 last:border-0"
          >
            <div className={`h-4 w-36 ${pulse}`} />
            <div className={`h-4 w-28 ${pulse}`} />
            <div className={`h-4 w-8 ${pulse}`} />
            <div className={`h-4 w-16 ${pulse}`} />
            <div className={`h-4 w-16 ${pulse}`} />
          </div>
        ))}
      </div>

      <div className="space-y-2 md:hidden">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="space-y-3 rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className={`h-4 w-40 ${pulse}`} />
              <div className={`h-4 w-16 ${pulse}`} />
            </div>
            <div className={`h-3 w-full max-w-[220px] ${pulse}`} />
          </div>
        ))}
      </div>
    </>
  );
};
