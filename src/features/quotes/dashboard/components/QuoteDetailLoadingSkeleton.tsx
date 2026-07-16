import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import React from 'react';

type QuoteDetailLoadingSkeletonProps = {
  backHref: string;
  backLabel: string;
};

const Line = ({ className }: { className: string }) => (
  <div className={`rounded-full bg-white/[0.08] ${className}`} />
);

export function QuoteDetailLoadingSkeleton({
  backHref,
  backLabel,
}: QuoteDetailLoadingSkeletonProps) {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
        <QuoteFlowHeader
          backHref={backHref}
          backLabel={backLabel}
          hideDividerAfterTitle
        />

        <div
          className="animate-pulse space-y-4 pb-28 sm:space-y-5 sm:pb-10"
          aria-label="Loading quote details"
          role="status"
        >
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Line className="h-4 w-20" />
              <Line className="h-6 w-16" />
            </div>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Line className="h-4 w-32 sm:w-44" />
                    <Line className="h-3 w-20" />
                    <Line className="h-3 w-14" />
                  </div>
                  <Line className="h-5 w-16" />
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <Line className="mb-2 h-3 w-16" />
                <Line className="h-3 w-4/5" />
                <Line className="mt-2 h-3 w-2/3" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3.5">
                <Line className="h-4 w-10" />
                <Line className="h-7 w-20" />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <Line className="h-4 w-20" />
            <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              {['w-28', 'w-44', 'w-32'].map(widthClass => (
                <div key={widthClass} className="flex items-center gap-3">
                  <div className="h-4 w-4 shrink-0 rounded bg-white/[0.08]" />
                  <Line className={`h-3 ${widthClass}`} />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Line className="h-4 w-16" />
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <Line className="h-3 w-40" />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-12 rounded-[10px] bg-white/[0.1]" />
            <div className="h-12 rounded-[10px] border border-white/[0.08] bg-white/[0.035]" />
          </div>
        </div>
      </div>
    </main>
  );
}
