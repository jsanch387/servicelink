import {
  PAYMENTS_REVENUE_DEFAULT_TIME_ZONE,
  PAYMENTS_REVENUE_PERIODS,
  PAYMENTS_REVENUE_RANGE_ERROR,
  type PaymentsRevenuePeriod,
} from './constants';
import { isValidTimeZone, isYmd } from './zonedDateTime';

export interface PaymentsRevenueQuery {
  period: PaymentsRevenuePeriod;
  timeZone: string;
  customFrom?: string;
  customTo?: string;
}

export type ParseRevenueQueryResult =
  | { ok: true; query: PaymentsRevenueQuery }
  | { ok: false; error: string };

export function parseRevenueQuery(
  searchParams: URLSearchParams
): ParseRevenueQueryResult {
  const periodRaw = (searchParams.get('period') ?? 'month').trim();
  const period =
    periodRaw === 'ytd' ? 'year' : (periodRaw as PaymentsRevenuePeriod);
  if (!PAYMENTS_REVENUE_PERIODS.includes(period)) {
    return {
      ok: false,
      error: 'period must be week, month, year, all, or custom.',
    };
  }

  const timeZoneRaw = searchParams.get('timeZone')?.trim();
  const timeZone =
    timeZoneRaw && isValidTimeZone(timeZoneRaw)
      ? timeZoneRaw
      : PAYMENTS_REVENUE_DEFAULT_TIME_ZONE;

  const customFrom = searchParams.get('from')?.trim() || undefined;
  const customTo = searchParams.get('to')?.trim() || undefined;

  if (period === 'custom') {
    if (!customFrom || !customTo || !isYmd(customFrom) || !isYmd(customTo)) {
      return { ok: false, error: PAYMENTS_REVENUE_RANGE_ERROR };
    }
    if (customFrom === customTo) {
      return { ok: false, error: PAYMENTS_REVENUE_RANGE_ERROR };
    }
  }

  return {
    ok: true,
    query: { period, timeZone, customFrom, customTo },
  };
}
