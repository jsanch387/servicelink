import {
  PAYMENTS_REVENUE_RANGE_ERROR,
  REVENUE_CUSTOM_DAILY_MAX_DAYS,
  REVENUE_CUSTOM_WEEKLY_MAX_DAYS,
  type PaymentsRevenuePeriod,
} from './constants';
import {
  daysInclusive,
  firstYmdOfMonth,
  lastYmdOfMonth,
  mondayOfContainingWeek,
  shiftCalendarMonth,
  shiftYmd,
  zonedYmd,
} from './zonedDateTime';

export type RevenueBucketKind = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RevenueRange {
  period: PaymentsRevenuePeriod;
  timeZone: string;
  fromYmd: string;
  toYmd: string;
  previousFromYmd: string;
  previousToYmd: string;
  comparePrevious: boolean;
  unbounded: boolean;
  bucketKind: RevenueBucketKind;
}

export type ResolveRevenueRangeResult =
  | { ok: true; range: RevenueRange }
  | { ok: false; error: string };

export function resolveRevenueRange(args: {
  period: PaymentsRevenuePeriod;
  now: Date;
  timeZone: string;
  customFrom?: string;
  customTo?: string;
}): ResolveRevenueRangeResult {
  const today = zonedYmd(args.now, args.timeZone);
  let fromYmd = today;
  let toYmd = today;
  let previousFromYmd = today;
  let previousToYmd = today;
  let comparePrevious = true;
  let unbounded = false;
  let bucketKind: RevenueBucketKind = 'daily';

  if (args.period === 'week') {
    fromYmd = mondayOfContainingWeek(today);
    toYmd = shiftYmd(fromYmd, 6);
    previousFromYmd = shiftYmd(fromYmd, -7);
    previousToYmd = shiftYmd(fromYmd, -1);
    bucketKind = 'daily';
  } else if (args.period === 'month') {
    fromYmd = firstYmdOfMonth(today);
    toYmd = lastYmdOfMonth(today);
    const prevMonth = shiftCalendarMonth(fromYmd, -1);
    previousFromYmd = prevMonth;
    previousToYmd = lastYmdOfMonth(prevMonth);
    bucketKind = 'weekly';
  } else if (args.period === 'year') {
    const year = today.slice(0, 4);
    fromYmd = `${year}-01-01`;
    toYmd = `${year}-12-31`;
    const lastYear = String(Number(year) - 1);
    previousFromYmd = `${lastYear}-01-01`;
    previousToYmd = `${lastYear}-12-31`;
    bucketKind = 'monthly';
  } else if (args.period === 'all') {
    fromYmd = today;
    toYmd = today;
    comparePrevious = false;
    unbounded = true;
    bucketKind = 'yearly';
  } else {
    if (!args.customFrom || !args.customTo) {
      return { ok: false, error: PAYMENTS_REVENUE_RANGE_ERROR };
    }
    fromYmd = args.customFrom;
    toYmd = args.customTo;
    if (fromYmd > toYmd) {
      fromYmd = args.customTo;
      toYmd = args.customFrom;
    }
    if (fromYmd === toYmd) {
      return { ok: false, error: PAYMENTS_REVENUE_RANGE_ERROR };
    }
    const span = daysInclusive(fromYmd, toYmd);
    previousToYmd = shiftYmd(fromYmd, -1);
    previousFromYmd = shiftYmd(previousToYmd, -(span - 1));
    bucketKind = customBucketKind(span);
  }

  return {
    ok: true,
    range: {
      period: args.period,
      timeZone: args.timeZone,
      fromYmd,
      toYmd,
      previousFromYmd,
      previousToYmd,
      comparePrevious,
      unbounded,
      bucketKind,
    },
  };
}

function customBucketKind(span: number): RevenueBucketKind {
  if (span <= REVENUE_CUSTOM_DAILY_MAX_DAYS) return 'daily';
  if (span <= REVENUE_CUSTOM_WEEKLY_MAX_DAYS) return 'weekly';
  return 'monthly';
}
