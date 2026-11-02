import React from 'react';

const pulse = 'animate-pulse rounded bg-white/10';

export const InvoicesListSkeleton: React.FC = () => {
  return (
    <div aria-hidden>
      <div className="hidden overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <div className="flex gap-10 border-b border-white/10 px-4 py-3">
          {['w-24', 'w-16', 'w-20', 'w-12', 'w-14'].map(width => (
            <div key={width} className={`h-3 ${width} ${pulse}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(row => (
          <div
            key={row}
            className="flex items-center gap-10 border-b border-white/5 px-4 py-4 last:border-0"
          >
            <div className={`h-4 w-36 ${pulse}`} />
            <div className={`h-4 w-14 ${pulse}`} />
            <div className={`h-4 w-28 ${pulse}`} />
            <div className={`h-4 w-16 ${pulse}`} />
            <div className={`h-6 w-14 rounded-full ${pulse}`} />
            <div className={`ml-auto h-4 w-5 ${pulse}`} />
          </div>
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map(row => (
          <div
            key={row}
            className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className={`h-5 w-32 ${pulse}`} />
              <div className={`h-6 w-14 rounded-full ${pulse}`} />
            </div>
            <div className={`h-3 w-full ${pulse}`} />
            <div className={`h-3 w-2/3 ${pulse}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const InvoicesDashboardSkeleton: React.FC = () => {
  return (
    <div role="status" aria-label="Loading invoices">
      <span className="sr-only">Loading invoices</span>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className={`h-9 w-40 ${pulse}`} />
          <div className={`mt-2 h-4 w-80 max-w-full ${pulse}`} />
        </div>
        <div className={`h-10 w-full rounded-[10px] sm:w-32 ${pulse}`} />
      </div>
      <div className="mb-6 flex gap-2">
        {['w-12', 'w-16', 'w-14', 'w-20'].map(width => (
          <div key={width} className={`h-9 ${width} rounded-full ${pulse}`} />
        ))}
      </div>
      <InvoicesListSkeleton />
    </div>
  );
};
