'use client';

import { DropdownSelect, GlassCard } from '@/components/shared';
import React, { useMemo, useState } from 'react';
import { usePaymentsRevenue } from '../hooks/usePaymentsRevenue';
import {
  PAYMENTS_REVENUE_PERIOD_LABELS,
  PAYMENTS_REVENUE_PERIODS,
  type PaymentsRevenuePeriod,
} from '../revenue/constants';
import { shiftYmd } from '../revenue/zonedDateTime';
import {
  formatRevenueChangeLabel,
  revenueChangeTone,
  revenueVersusLabel,
} from '../utils/formatRevenueChange';
import { formatRevenueDateRange } from '../utils/formatRevenueDateRange';
import { PaymentsRevenueAreaChart } from './PaymentsRevenueAreaChart';
import { PaymentsRevenueCustomRange } from './PaymentsRevenueCustomRange';

const PERIOD_OPTIONS = PAYMENTS_REVENUE_PERIODS.map(id => ({
  value: id,
  label: PAYMENTS_REVENUE_PERIOD_LABELS[id],
}));

export function PaymentsRevenueChart() {
  const defaultCustom = useMemo(() => defaultCustomRange(), []);
  const [period, setPeriod] = useState<PaymentsRevenuePeriod>('month');
  const [customRange, setCustomRange] = useState(defaultCustom);
  const { data, loading, error, reload } = usePaymentsRevenue({
    period,
    customFrom: customRange.from,
    customTo: customRange.to,
  });

  const dateRange =
    period === 'all'
      ? 'All time'
      : data
        ? formatRevenueDateRange(data.from, data.to)
        : '';
  const hasSeries = (data?.buckets.length ?? 0) > 0;
  const jobsPaid = data?.jobsPaid ?? 0;

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {loading ? (
            <div className="h-10 w-40 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p className="text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl">
              {data?.totalLabel ?? '$0'}
            </p>
          )}
        </div>
        <div className="w-[8.75rem] shrink-0">
          <DropdownSelect
            value={period}
            onChange={next => {
              if (isRevenuePeriod(next)) setPeriod(next);
            }}
            options={PERIOD_OPTIONS}
            placeholder="Range"
            panelMaxHeightClassName="max-h-72"
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
        {loading || period === 'all' ? (
          <span />
        ) : (
          <ChangeBadge changePercent={data?.changePercent} period={period} />
        )}
        {loading ? (
          <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/10" />
        ) : dateRange ? (
          <span className="whitespace-nowrap text-zinc-500">{dateRange}</span>
        ) : null}
      </div>
      {loading ? null : (
        <p className="mt-1 text-xs text-zinc-500">
          {jobsPaid === 0
            ? 'Finish a job and it shows up here.'
            : `${jobsPaid} job${jobsPaid === 1 ? '' : 's'} paid`}
        </p>
      )}

      {period === 'custom' ? (
        <div className="mt-4">
          <PaymentsRevenueCustomRange
            from={customRange.from}
            to={customRange.to}
            onChange={setCustomRange}
          />
        </div>
      ) : null}

      <div className="mt-6">
        {error ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-zinc-400">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="cursor-pointer text-sm font-medium text-white underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div
            className="h-52 animate-pulse rounded-xl bg-white/[0.04]"
            aria-label="Loading earnings chart"
          />
        ) : hasSeries ? (
          <PaymentsRevenueAreaChart buckets={data?.buckets ?? []} />
        ) : (
          <div className="flex h-52 items-center justify-center text-sm text-zinc-500">
            Finish a job and it shows up here.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function isRevenuePeriod(value: string): value is PaymentsRevenuePeriod {
  return PAYMENTS_REVENUE_PERIODS.includes(value as PaymentsRevenuePeriod);
}

function ChangeBadge({
  changePercent,
  period,
}: {
  changePercent: number | null | undefined;
  period: PaymentsRevenuePeriod;
}) {
  const tone = revenueChangeTone(changePercent);
  return (
    <span
      className={`font-medium tabular-nums ${
        tone === 'up'
          ? 'text-emerald-400'
          : tone === 'down'
            ? 'text-red-400'
            : 'text-zinc-400'
      }`}
    >
      {formatRevenueChangeLabel(changePercent, revenueVersusLabel(period))}
    </span>
  );
}

function defaultCustomRange(): { from: string; to: string } {
  const now = new Date();
  const to = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return { from: shiftYmd(to, -13), to };
}
