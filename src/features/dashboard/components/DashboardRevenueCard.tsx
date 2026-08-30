'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { usePaymentsRevenue } from '@/features/payments/hooks/usePaymentsRevenue';
import {
  formatRevenueChangeLabel,
  revenueChangeTone,
  revenueVersusLabel,
} from '@/features/payments/utils/formatRevenueChange';
import React from 'react';
import { dashboardCardButtonClass } from '../utils/dashboardCardStyles';
import { DashboardGlassCard } from './DashboardGlassCard';

const TONE_CLASS: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-zinc-500',
};

export function DashboardRevenueCard() {
  const { data, loading, error } = usePaymentsRevenue({ period: 'week' });

  if (loading && !data) {
    return (
      <DashboardGlassCard>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="h-9 w-28 rounded bg-white/10" />
          <div className="h-3 w-32 rounded bg-white/10" />
        </div>
      </DashboardGlassCard>
    );
  }

  const empty = !error && (data?.totalCents ?? 0) === 0;
  const change = formatRevenueChangeLabel(
    data?.changePercent,
    revenueVersusLabel('week')
  );
  const toneClass = TONE_CLASS[revenueChangeTone(data?.changePercent)];

  return (
    <DashboardGlassCard>
      <p className="text-sm text-zinc-400">This week</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
        {data?.totalLabel ?? '$0'}
      </p>
      <p
        className={`mt-1 text-xs leading-snug ${
          error ? 'text-zinc-500' : empty ? 'text-zinc-500' : toneClass
        }`}
      >
        {error
          ? "Couldn't load revenue"
          : empty
            ? 'Nothing collected yet'
            : change}
      </p>
      <Button
        href={ROUTES.DASHBOARD.PAYMENTS}
        variant="ghost"
        fullWidth
        className={`mt-auto pt-3 ${dashboardCardButtonClass}`}
      >
        View payments
      </Button>
    </DashboardGlassCard>
  );
}
