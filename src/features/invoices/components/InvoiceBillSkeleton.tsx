import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';
const paperPulse = 'animate-pulse rounded bg-[#eceae4]';

/** Sent, paid, and void invoices: the bill only, with no editor fields. */
export const InvoiceBillSkeleton: React.FC = () => {
  return (
    <div className="flex w-full flex-1 flex-col bg-[var(--dashboard-bg)]">
      <div
        role="status"
        aria-label="Loading invoice"
        className="flex w-full flex-col gap-3 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
      >
        <span className="sr-only">Loading invoice</span>
        <div className={`h-4 w-24 ${pulse}`} aria-hidden />
        <div className={`h-11 w-11 rounded-lg ${pulse}`} aria-hidden />
      </div>
      <div
        className="flex flex-1 flex-col px-3 pt-4 pb-6 sm:px-8 sm:pt-5 sm:pb-8"
        aria-hidden
      >
        <article className="mx-auto flex min-h-[min(800px,calc(100dvh-12rem))] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white px-5 py-8 shadow-[0_18px_50px_rgba(28,24,20,0.12)] sm:rounded-3xl sm:px-12 sm:py-14">
          <div className="flex items-start justify-between gap-4">
            <div className={`h-3 w-28 ${paperPulse}`} />
            <div className={`h-6 w-16 rounded-full ${paperPulse}`} />
          </div>
          <div className={`mt-3 h-8 w-56 ${paperPulse}`} />
          <div className="mt-8 grid gap-6 border-t border-[#eceae4] pt-8 sm:grid-cols-2">
            <div className="space-y-2">
              <div className={`h-3 w-16 ${paperPulse}`} />
              <div className={`h-5 w-36 ${paperPulse}`} />
              <div className={`h-4 w-44 ${paperPulse}`} />
            </div>
            <div className="space-y-2 sm:items-end sm:text-right">
              <div className={`h-3 w-16 ${paperPulse} sm:ml-auto`} />
              <div className={`h-5 w-32 ${paperPulse} sm:ml-auto`} />
            </div>
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_7rem_7rem] gap-x-4 rounded-lg bg-[#f4f3f0] px-3 py-2.5">
              <div className={`h-3 w-8 ${paperPulse}`} />
              <div className={`h-3 w-6 justify-self-end ${paperPulse}`} />
              <div className={`h-3 w-14 justify-self-end ${paperPulse}`} />
              <div className={`h-3 w-12 justify-self-end ${paperPulse}`} />
            </div>
            {[0, 1].map(row => (
              <div
                key={row}
                className="grid grid-cols-[minmax(0,1fr)_3.5rem_7rem_7rem] items-center gap-x-4 border-b border-[#f0eee9] py-4"
              >
                <div className={`h-4 w-40 ${paperPulse}`} />
                <div className={`h-4 w-4 justify-self-end ${paperPulse}`} />
                <div className={`h-4 w-14 justify-self-end ${paperPulse}`} />
                <div className={`h-4 w-14 justify-self-end ${paperPulse}`} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex w-full flex-col gap-3 sm:ml-auto sm:max-w-xs sm:pr-3">
            <div className="flex justify-between gap-6">
              <div className={`h-4 w-16 ${paperPulse}`} />
              <div className={`h-4 w-14 ${paperPulse}`} />
            </div>
            <div className="flex justify-between gap-6 border-t border-[#eceae4] pt-3">
              <div className={`h-5 w-24 ${paperPulse}`} />
              <div className={`h-5 w-16 ${paperPulse}`} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
