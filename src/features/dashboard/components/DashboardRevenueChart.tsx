'use client';

import { DropdownSelect } from '@/components/shared';
import { usePaymentsRevenue } from '@/features/payments/hooks/usePaymentsRevenue';
import type { PaymentsRevenuePeriod } from '@/features/payments/revenue/constants';
import { PaymentsRevenueAreaChart } from '@/features/payments/components/PaymentsRevenueAreaChart';
import { formatRevenueDateRange } from '@/features/payments/utils/formatRevenueDateRange';
import React, { useState } from 'react';
import { DashboardGlassCard } from './DashboardGlassCard';

const CHART_RANGES: { value: PaymentsRevenuePeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

type DashboardChartRange = 'week' | 'month' | 'year';

/** Revenue chart. Its own request, so the week card can finish first. */
export function DashboardRevenueChart() {
  const [range, setRange] = useState<DashboardChartRange>('year');
  const { data, loading, error, reload } = usePaymentsRevenue({
    period: range,
  });
  const dateRange = data ? formatRevenueDateRange(data.from, data.to) : '';

  return (
    <DashboardGlassCard
      fillGridCell={false}
      padding="none"
      className="flex h-full flex-col p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-white">Revenue</p>
          {loading && !dateRange ? (
            <div className="mt-1.5 h-3 w-36 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{dateRange}</p>
          )}
        </div>
        <div className="w-[8.75rem] shrink-0">
          <DropdownSelect
            value={range}
            onChange={next => {
              if (isChartRange(next)) setRange(next);
            }}
            options={CHART_RANGES}
            placeholder="Range"
            panelMaxHeightClassName="max-h-72"
          />
        </div>
      </div>
      <div className="relative mt-3 min-h-44 flex-1">
        {loading ? (
          <div
            className="h-full min-h-44 animate-pulse rounded-xl bg-white/[0.04]"
            aria-label="Loading revenue"
          />
        ) : error || !data ? (
          <div className="flex h-full min-h-44 flex-col items-start justify-center gap-2">
            <p className="text-sm text-zinc-400">
              {error ?? "Couldn't load earnings."}
            </p>
            <button
              type="button"
              onClick={reload}
              className="cursor-pointer text-sm font-medium text-white hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <PaymentsRevenueAreaChart
            buckets={data.buckets}
            heightClassName="h-full min-h-44"
          />
        )}
      </div>
    </DashboardGlassCard>
  );
}

function isChartRange(value: string): value is DashboardChartRange {
  return CHART_RANGES.some(option => option.value === value);
}
