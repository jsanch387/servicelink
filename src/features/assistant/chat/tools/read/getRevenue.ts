import { computeBookingEarningsCents } from '@/features/payments/revenue/computeBookingEarningsCents';
import type { RevenueBookingRow } from '@/features/payments/revenue/computeBookingEarningsCents';
import { PAYMENTS_REVENUE_DEFAULT_TIME_ZONE } from '@/features/payments/revenue/constants';
import { loadCompletedBookingPayments } from '@/features/payments/revenue/loadCompletedBookingPayments';
import { resolveRevenueRange } from '@/features/payments/revenue/resolveRevenueRange';
import {
  firstYmdOfMonth,
  lastYmdOfMonth,
  shiftCalendarMonth,
  zonedYmd,
} from '@/features/payments/revenue/zonedDateTime';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const GET_REVENUE_PERIODS = [
  'week',
  'month',
  'last_month',
  'year',
  'all',
] as const;

export type GetRevenuePeriod = (typeof GET_REVENUE_PERIODS)[number];

type BookingRowWithService = RevenueBookingRow & {
  service_name?: string | null;
};

export type GetRevenueResult =
  | {
      ok: true;
      period: GetRevenuePeriod;
      fromYmd: string;
      toYmd: string;
      collectedCents: number;
      collectedLabel: string;
      jobCount: number;
      previousCollectedCents: number | null;
      previousCollectedLabel: string | null;
      changePercent: number | null;
      byService: Array<{
        serviceName: string;
        collectedCents: number;
        collectedLabel: string;
        jobCount: number;
      }>;
    }
  | { ok: false; error: string };

/** Shop-scoped revenue for Assistant chat. `businessId` from session only. */
export async function executeGetRevenue(args: {
  businessId: string;
  period: GetRevenuePeriod;
  timeZone?: string;
  now?: Date;
}): Promise<GetRevenueResult> {
  const timeZone = args.timeZone?.trim() || PAYMENTS_REVENUE_DEFAULT_TIME_ZONE;
  const now = args.now ?? new Date();

  const range = resolveChatRevenueRange({
    period: args.period,
    now,
    timeZone,
  });
  if (!range.ok) {
    return { ok: false, error: range.error };
  }

  const lookbackFromYmd = range.range.unbounded
    ? null
    : range.range.comparePrevious
      ? range.range.previousFromYmd
      : range.range.fromYmd;
  const lookbackToYmd = range.range.unbounded ? null : range.range.toYmd;

  const admin = createSupabaseAdminClient();
  const loaded = await loadCompletedBookingPayments(admin, {
    businessId: args.businessId,
    fromYmd: lookbackFromYmd,
    toYmd: lookbackToYmd,
  });
  if (!loaded.ok) {
    return { ok: false, error: 'Could not load revenue right now.' };
  }

  const todayYmd = zonedYmd(now, timeZone);
  let collectedCents = 0;
  let previousCollectedCents = 0;
  let jobCount = 0;
  const byServiceMap = new Map<
    string,
    { collectedCents: number; jobCount: number }
  >();

  for (const row of loaded.rows as BookingRowWithService[]) {
    const earnings = computeBookingEarningsCents(row);
    if (!earnings) continue;
    const day = earnings.scheduledYmd;
    const inCurrent =
      range.range.unbounded ||
      (day >= range.range.fromYmd && day <= range.range.toYmd);
    if (inCurrent) {
      collectedCents += earnings.collectedCents;
      jobCount += 1;
      const serviceName = row.service_name?.trim() || 'Service';
      const existing = byServiceMap.get(serviceName) ?? {
        collectedCents: 0,
        jobCount: 0,
      };
      existing.collectedCents += earnings.collectedCents;
      existing.jobCount += 1;
      byServiceMap.set(serviceName, existing);
    }
    if (
      range.range.comparePrevious &&
      day >= range.range.previousFromYmd &&
      day <= range.range.previousToYmd
    ) {
      previousCollectedCents += earnings.collectedCents;
    }
  }

  const byService = [...byServiceMap.entries()]
    .map(([serviceName, stats]) => ({
      serviceName,
      collectedCents: stats.collectedCents,
      collectedLabel: formatPaymentDollars(stats.collectedCents),
      jobCount: stats.jobCount,
    }))
    .sort((a, b) => b.collectedCents - a.collectedCents)
    .slice(0, 5);

  const changePercent = range.range.comparePrevious
    ? previousCollectedCents === 0
      ? collectedCents === 0
        ? 0
        : null
      : Math.round(
          ((collectedCents - previousCollectedCents) / previousCollectedCents) *
            1000
        ) / 10
    : null;

  return {
    ok: true,
    period: args.period,
    fromYmd: range.range.fromYmd,
    toYmd: range.range.toYmd,
    collectedCents,
    collectedLabel: formatPaymentDollars(collectedCents),
    jobCount,
    previousCollectedCents: range.range.comparePrevious
      ? previousCollectedCents
      : null,
    previousCollectedLabel: range.range.comparePrevious
      ? formatPaymentDollars(previousCollectedCents)
      : null,
    changePercent,
    byService,
  };
}

function resolveChatRevenueRange(args: {
  period: GetRevenuePeriod;
  now: Date;
  timeZone: string;
}) {
  if (args.period === 'last_month') {
    const today = zonedYmd(args.now, args.timeZone);
    const thisMonthStart = firstYmdOfMonth(today);
    const lastMonthStart = shiftCalendarMonth(thisMonthStart, -1);
    const lastMonthEnd = lastYmdOfMonth(lastMonthStart);
    const priorMonthStart = shiftCalendarMonth(lastMonthStart, -1);
    const priorMonthEnd = lastYmdOfMonth(priorMonthStart);

    return {
      ok: true as const,
      range: {
        period: 'custom' as const,
        timeZone: args.timeZone,
        fromYmd: lastMonthStart,
        toYmd: lastMonthEnd,
        previousFromYmd: priorMonthStart,
        previousToYmd: priorMonthEnd,
        comparePrevious: true,
        unbounded: false,
        bucketKind: 'weekly' as const,
      },
    };
  }

  return resolveRevenueRange({
    period: args.period,
    now: args.now,
    timeZone: args.timeZone,
  });
}
