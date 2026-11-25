import { PAYMENTS_REVENUE_DEFAULT_TIME_ZONE } from '@/features/payments/revenue/constants';
import { resolveRevenueRange } from '@/features/payments/revenue/resolveRevenueRange';
import {
  firstYmdOfMonth,
  lastYmdOfMonth,
  mondayOfContainingWeek,
  shiftCalendarMonth,
  shiftYmd,
  zonedYmd,
} from '@/features/payments/revenue/zonedDateTime';

export const CHAT_PERIODS = [
  'week',
  'month',
  'last_month',
  'year',
  'all',
] as const;

export type ChatPeriod = (typeof CHAT_PERIODS)[number];

export type ChatPeriodRange = {
  period: ChatPeriod;
  fromYmd: string;
  toYmd: string;
  unbounded: boolean;
};

export function resolveChatPeriodRange(args: {
  period: ChatPeriod;
  now?: Date;
  timeZone?: string;
}): ChatPeriodRange {
  const timeZone = args.timeZone?.trim() || PAYMENTS_REVENUE_DEFAULT_TIME_ZONE;
  const now = args.now ?? new Date();
  const today = zonedYmd(now, timeZone);

  if (args.period === 'last_month') {
    const thisMonthStart = firstYmdOfMonth(today);
    const lastMonthStart = shiftCalendarMonth(thisMonthStart, -1);
    return {
      period: 'last_month',
      fromYmd: lastMonthStart,
      toYmd: lastYmdOfMonth(lastMonthStart),
      unbounded: false,
    };
  }

  if (args.period === 'week') {
    const fromYmd = mondayOfContainingWeek(today);
    return {
      period: 'week',
      fromYmd,
      toYmd: shiftYmd(fromYmd, 6),
      unbounded: false,
    };
  }

  const resolved = resolveRevenueRange({
    period: args.period,
    now,
    timeZone,
  });
  if (!resolved.ok) {
    return {
      period: args.period,
      fromYmd: today,
      toYmd: today,
      unbounded: args.period === 'all',
    };
  }

  return {
    period: args.period,
    fromYmd: resolved.range.fromYmd,
    toYmd: resolved.range.toYmd,
    unbounded: resolved.range.unbounded,
  };
}

export function todayYmd(now: Date = new Date(), timeZone?: string): string {
  return zonedYmd(
    now,
    timeZone?.trim() || PAYMENTS_REVENUE_DEFAULT_TIME_ZONE
  );
}
