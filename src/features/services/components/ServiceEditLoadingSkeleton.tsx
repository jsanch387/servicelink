/**
 * Loading skeleton for the service edit page.
 * Matches ServiceEditScreen: back link, title, collapsed sections, sticky actions.
 */

import React from 'react';

const sectionClass =
  'rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8';

function CollapsedSectionSkeleton({
  titleWidth = 'w-32',
  subtitleWidth = 'w-40',
}: {
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <section className={sectionClass}>
      <div className="flex items-center justify-between gap-3 animate-pulse">
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-5 ${titleWidth} bg-white/10 rounded`} />
          <div
            className={`h-3 ${subtitleWidth} max-w-full bg-white/10 rounded`}
          />
        </div>
        <div className="h-5 w-5 bg-white/10 rounded shrink-0" />
      </div>
    </section>
  );
}

export const ServiceEditLoadingSkeleton: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[var(--dashboard-bg)]">
      <div className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto pb-24">
        <div className="flex items-center gap-2 mb-4 animate-pulse">
          <div className="h-5 w-5 bg-white/10 rounded shrink-0" />
          <div className="h-4 w-28 bg-white/10 rounded" />
        </div>

        <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
          <div className="h-7 w-36 bg-white/10 rounded mb-4 sm:mb-6 animate-pulse" />

          <CollapsedSectionSkeleton titleWidth="w-36" subtitleWidth="w-48" />
          <CollapsedSectionSkeleton titleWidth="w-24" subtitleWidth="w-28" />
          <CollapsedSectionSkeleton titleWidth="w-40" subtitleWidth="w-24" />
          <CollapsedSectionSkeleton titleWidth="w-20" subtitleWidth="w-24" />
        </div>
      </div>

      <div
        className="sticky bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 safe-area-pb"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col-reverse sm:flex-row gap-3 animate-pulse">
          <div className="h-11 w-full sm:w-32 bg-white/10 rounded-xl" />
          <div className="h-11 w-full sm:flex-1 bg-white/10 rounded-xl" />
        </div>
      </div>
    </main>
  );
};
