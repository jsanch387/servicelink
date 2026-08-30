'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCallback, useEffect, useState } from 'react';
import type { PaymentsRevenuePeriod } from '../revenue/constants';
import type { RevenueBucket } from '../revenue/summarizeRevenue';

export interface PaymentsRevenueData {
  period: string;
  from: string;
  to: string;
  totalCents: number;
  totalLabel: string;
  previousTotalCents: number;
  changePercent: number | null;
  jobsPaid: number;
  bucketKind: string;
  buckets: RevenueBucket[];
}

export function usePaymentsRevenue(args: {
  period: PaymentsRevenuePeriod;
  customFrom?: string;
  customTo?: string;
}) {
  const [data, setData] = useState<PaymentsRevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey(key => key + 1), []);

  useEffect(() => {
    if (
      args.period === 'custom' &&
      (!args.customFrom || !args.customTo || args.customFrom === args.customTo)
    ) {
      return;
    }

    const params = new URLSearchParams({
      period: args.period,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
    if (args.period === 'custom' && args.customFrom && args.customTo) {
      params.set('from', args.customFrom);
      params.set('to', args.customTo);
    }

    const controller = new AbortController();
    setData(null);
    setLoading(true);
    setError(null);

    void fetch(`${API_ROUTES.PAYMENTS_REVENUE}?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async response => {
        const body = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        } & Partial<PaymentsRevenueData>;
        if (!response.ok || body.success === false) {
          throw new Error(
            typeof body.error === 'string' && body.error.trim()
              ? body.error
              : "Couldn't load earnings. Try again."
          );
        }
        setData({
          period: body.period ?? args.period,
          from: body.from ?? '',
          to: body.to ?? '',
          totalCents: body.totalCents ?? 0,
          totalLabel: body.totalLabel ?? '$0',
          previousTotalCents: body.previousTotalCents ?? 0,
          changePercent: body.changePercent ?? null,
          jobsPaid: body.jobsPaid ?? 0,
          bucketKind: body.bucketKind ?? '',
          buckets: body.buckets ?? [],
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(
          err instanceof Error ? err.message : "Couldn't load earnings."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [args.customFrom, args.customTo, args.period, reloadKey]);

  return { data, loading, error, reload };
}
