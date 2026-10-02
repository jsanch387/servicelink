/**
 * DashboardLoadingState - Skeleton for the home dashboard
 * Shown while the page opens and before each card fills in.
 */

import { DashboardGlassCard } from './DashboardGlassCard';
import React from 'react';

const mainClassName =
  'flex-1 min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-5 pb-24 sm:px-6 sm:pt-6 sm:pb-8 lg:px-8 lg:pt-8 lg:pb-10';

export const DashboardLoadingState: React.FC = () => {
  return (
    <main className={mainClassName} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <div className="w-full min-w-0 animate-pulse">
        <div className="mb-5 h-8 w-52 rounded-lg bg-white/10 sm:mb-6 sm:h-9" />

        <div className="flex flex-col gap-4 lg:gap-5">
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <DashboardGlassCard className="h-full">
              <div className="flex flex-1 items-center gap-4">
                <div className="flex min-w-0 flex-1 flex-col self-stretch">
                  <div className="h-4 w-36 rounded bg-white/10" />
                  <div className="mt-3 h-10 w-28 rounded-lg bg-white/10" />
                  <div className="mt-auto h-4 w-40 rounded bg-white/10 pt-5" />
                </div>
                <div className="h-12 w-32 shrink-0 rounded-lg bg-white/[0.06]" />
              </div>
            </DashboardGlassCard>

            <DashboardGlassCard className="h-full">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="h-4 w-20 rounded bg-white/10" />
                  <div className="mt-3 h-10 w-16 rounded-lg bg-white/10" />
                </div>
                <div className="h-8 w-[5.5rem] rounded-md bg-white/10" />
              </div>
              <div className="mt-auto h-3 w-28 rounded bg-white/10 pt-3" />
            </DashboardGlassCard>

            <DashboardGlassCard className="h-full">
              <div className="h-5 w-24 rounded bg-white/10" />
              <div className="mt-4 flex flex-col gap-3">
                <div className="h-[4.25rem] rounded-xl bg-white/[0.04]" />
                <div className="h-[4.25rem] rounded-xl bg-white/[0.04]" />
              </div>
            </DashboardGlassCard>
          </div>

          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
            <DashboardGlassCard className="h-full">
              <div className="flex items-center justify-between gap-3">
                <div className="h-5 w-20 rounded bg-white/10" />
                <div className="h-3 w-14 rounded bg-white/10" />
              </div>
              <div className="mt-5 space-y-3">
                <div className="h-3 w-16 rounded bg-white/10" />
                <div className="h-12 rounded-lg bg-white/[0.04]" />
                <div className="h-12 rounded-lg bg-white/[0.04]" />
              </div>
            </DashboardGlassCard>

            <DashboardGlassCard
              fillGridCell={false}
              padding="none"
              className="flex h-full flex-col p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="h-5 w-20 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-36 rounded bg-white/10" />
                </div>
                <div className="h-10 w-[8.75rem] shrink-0 rounded-[10px] bg-white/10" />
              </div>
              <div className="mt-3 h-44 rounded-xl bg-white/[0.04]" />
            </DashboardGlassCard>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardLoadingState;
