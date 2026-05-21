/**
 * DashboardLoadingState - Skeleton for main Dashboard page
 */

import { DashboardGlassCard } from './DashboardGlassCard';
import React from 'react';

export const DashboardLoadingState: React.FC = () => {
  return (
    <main className="flex-1 py-5 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        <div>
          <div className="h-7 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-56 mt-2 bg-white/10 rounded animate-pulse" />
        </div>

        <DashboardGlassCard fillGridCell={false}>
          <div className="h-4 w-28 bg-white/10 rounded animate-pulse mb-3" />
          <div className="flex flex-col sm:flex-row gap-2 animate-pulse">
            <div className="h-10 flex-1 rounded-lg bg-white/[0.06]" />
            <div className="h-10 w-full sm:w-24 rounded-lg bg-white/10" />
          </div>
        </DashboardGlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {[1, 2, 3, 4].map(i => (
            <DashboardGlassCard key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-9 w-12 bg-white/10 rounded" />
                <div className="h-3 w-28 bg-white/10 rounded" />
              </div>
            </DashboardGlassCard>
          ))}
        </div>
      </div>
    </main>
  );
};

export default DashboardLoadingState;
