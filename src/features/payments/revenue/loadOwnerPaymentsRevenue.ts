import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { assertOwnerPaymentsTransactionsRateLimits } from '@/server/rateLimit/ownerPaymentsTransactionsRateLimit';
import type { NextRequest } from 'next/server';
import { aggregatePaymentsRevenue } from './aggregatePaymentsRevenue';
import {
  PAYMENTS_REVENUE_LOAD_ERROR,
  PAYMENTS_REVENUE_SIGN_IN_AGAIN,
} from './constants';
import { loadCompletedBookingPayments } from './loadCompletedBookingPayments';
import { parseRevenueQuery } from './parseRevenueQuery';
import { resolveRevenueRange } from './resolveRevenueRange';
import type { RevenueBucket } from './summarizeRevenue';
import { zonedYmd } from './zonedDateTime';

export type LoadOwnerPaymentsRevenueResult =
  | {
      ok: true;
      currency: string;
      period: string;
      fromYmd: string;
      toYmd: string;
      totalCents: number;
      totalLabel: string;
      previousTotalCents: number;
      changePercent: number | null;
      jobsPaid: number;
      bucketKind: string;
      buckets: RevenueBucket[];
    }
  | {
      ok: false;
      httpStatus: number;
      error: string;
      retryAfterSec?: number;
    };

export async function loadOwnerPaymentsRevenue(
  request: NextRequest
): Promise<LoadOwnerPaymentsRevenueResult> {
  const auth = await resolveTapToPayRouteAuth(request);
  if (!auth.ok) {
    return {
      ok: false,
      httpStatus: auth.httpStatus,
      error:
        auth.httpStatus === 401 ? PAYMENTS_REVENUE_SIGN_IN_AGAIN : auth.error,
    };
  }

  const rate = await assertOwnerPaymentsTransactionsRateLimits(
    request,
    auth.user.id
  );
  if (!rate.ok) {
    return {
      ok: false,
      httpStatus: 429,
      error: PAYMENTS_REVENUE_LOAD_ERROR,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const parsed = parseRevenueQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return { ok: false, httpStatus: 400, error: parsed.error };
  }

  const now = new Date();
  const range = resolveRevenueRange({
    period: parsed.query.period,
    now,
    timeZone: parsed.query.timeZone,
    customFrom: parsed.query.customFrom,
    customTo: parsed.query.customTo,
  });
  if (!range.ok) {
    return { ok: false, httpStatus: 400, error: range.error };
  }

  const lookbackFromYmd = range.range.unbounded
    ? null
    : range.range.comparePrevious
      ? range.range.previousFromYmd
      : range.range.fromYmd;
  const lookbackToYmd = range.range.unbounded ? null : range.range.toYmd;

  const loaded = await loadCompletedBookingPayments(auth.supabase, {
    businessId: auth.business.id,
    fromYmd: lookbackFromYmd,
    toYmd: lookbackToYmd,
  });
  if (!loaded.ok) {
    return {
      ok: false,
      httpStatus: 502,
      error: PAYMENTS_REVENUE_LOAD_ERROR,
    };
  }

  const todayYmd = zonedYmd(now, range.range.timeZone);
  const summary = aggregatePaymentsRevenue({
    rows: loaded.rows,
    range: range.range,
    todayYmd,
  });

  return {
    ok: true,
    currency: 'usd',
    period: range.range.period,
    fromYmd: range.range.fromYmd,
    toYmd: range.range.toYmd,
    totalCents: summary.collectedCents,
    totalLabel: formatPaymentDollars(summary.collectedCents),
    previousTotalCents: summary.previousTotalCents,
    changePercent: summary.changePercent,
    jobsPaid: summary.jobsPaid,
    bucketKind: summary.bucketKind,
    buckets: summary.buckets,
  };
}
