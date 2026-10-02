'use client';

import { usePaymentsRevenue } from '@/features/payments/hooks/usePaymentsRevenue';
import {
  formatRevenueChangeLabel,
  revenueChangeTone,
  revenueVersusLabel,
} from '@/features/payments/utils/formatRevenueChange';
import React from 'react';
import { DashboardGlassCard } from './DashboardGlassCard';
import { DashboardInsightCard } from './DashboardInsightCard';

/** This week's collected revenue. Loads on its own, apart from the chart. */
export function DashboardRevenueCard({ href }: { href?: string }) {
  const { data, loading, error, reload } = usePaymentsRevenue({
    period: 'week',
  });

  if (loading) {
    return (
      <DashboardGlassCard className="h-full">
        <div className="flex flex-1 animate-pulse flex-col">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="mt-3 h-10 w-32 rounded bg-white/10" />
          <div className="mt-auto h-4 w-40 rounded bg-white/10 pt-5" />
        </div>
      </DashboardGlassCard>
    );
  }

  if (error || !data) {
    return (
      <DashboardGlassCard className="h-full">
        <p className="text-sm text-zinc-400">This week&apos;s revenue</p>
        <p className="mt-3 text-sm text-zinc-400">
          {error ?? "Couldn't load earnings."}
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 cursor-pointer text-sm font-medium text-white hover:underline"
        >
          Try again
        </button>
      </DashboardGlassCard>
    );
  }

  return (
    <DashboardInsightCard
      label="This week's revenue"
      value={data.totalLabel}
      change={formatRevenueChangeLabel(
        data.changePercent,
        revenueVersusLabel('week')
      )}
      tone={revenueChangeTone(data.changePercent)}
      trend={data.buckets.map(bucket => bucket.totalCents)}
      href={href}
    />
  );
}
