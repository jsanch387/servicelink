import type { PaymentsTransactionSource } from '../transactions/constants';
import { PAYMENTS_REVENUE_SOURCE_LABELS } from './constants';
import { shiftYmd, zonedYearMonth, zonedYmd } from './zonedDateTime';

export type RevenueBucketSize = 'day' | 'month';

export interface RevenueEvent {
  createdAt: string;
  amountCents: number;
  source: PaymentsTransactionSource;
}

export interface RevenueBucket {
  key: string;
  label: string;
  hoverLabel?: string;
  totalCents: number;
}

export interface RevenueSourceTotal {
  source: PaymentsTransactionSource;
  label: string;
  cents: number;
}

export function eachDayKey(fromYmd: string, toYmd: string): string[] {
  const keys: string[] = [];
  let cursor = fromYmd;
  while (cursor <= toYmd) {
    keys.push(cursor);
    cursor = shiftYmd(cursor, 1);
  }
  return keys;
}

export function eachMonthKey(fromYmd: string, toYmd: string): string[] {
  const keys: string[] = [];
  let year = Number(fromYmd.slice(0, 4));
  let month = Number(fromYmd.slice(5, 7));
  const endYear = Number(toYmd.slice(0, 4));
  const endMonth = Number(toYmd.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

export function eventBucketKey(
  createdAt: string,
  timeZone: string,
  bucket: RevenueBucketSize
): string | null {
  const instant = new Date(createdAt);
  if (Number.isNaN(instant.getTime())) return null;
  return bucket === 'month'
    ? zonedYearMonth(instant, timeZone)
    : zonedYmd(instant, timeZone);
}

export interface BucketLabelOptions {
  todayYmd?: string;
  /** Week chart ticks: Today, Yesterday, then Mon / Tue. */
  weekdayTicks?: boolean;
}

function bucketDate(key: string, bucket: RevenueBucketSize): Date {
  return new Date(
    bucket === 'month' ? `${key}-01T12:00:00Z` : `${key}T12:00:00Z`
  );
}

function relativeDayWord(
  key: string,
  todayYmd: string | undefined
): 'Today' | 'Yesterday' | null {
  if (!todayYmd) return null;
  if (key === todayYmd) return 'Today';
  if (key === shiftYmd(todayYmd, -1)) return 'Yesterday';
  return null;
}

export function formatBucketLabel(
  key: string,
  bucket: RevenueBucketSize,
  options: BucketLabelOptions = {}
): string {
  if (bucket === 'month') {
    return bucketDate(key, bucket).toLocaleDateString('en-US', {
      month: 'short',
    });
  }
  if (options.weekdayTicks) {
    const relative = relativeDayWord(key, options.todayYmd);
    if (relative) return relative;
    return bucketDate(key, bucket).toLocaleDateString('en-US', {
      weekday: 'short',
    });
  }
  return bucketDate(key, bucket).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Hover: "Today, Aug 24" / "Mon, Aug 24" for days, "Aug 2026" for months. */
export function formatBucketHoverLabel(
  key: string,
  bucket: RevenueBucketSize,
  options: BucketLabelOptions = {}
): string {
  if (bucket === 'month') {
    return bucketDate(key, bucket).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  const date = bucketDate(key, bucket);
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const relative = relativeDayWord(key, options.todayYmd);
  if (relative) return `${relative}, ${monthDay}`;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function bucketRevenueEvents(
  events: RevenueEvent[],
  args: {
    fromYmd: string;
    toYmd: string;
    timeZone: string;
    bucket: RevenueBucketSize;
    fromIso: string;
    toIso: string;
    todayYmd?: string;
    weekdayTicks?: boolean;
  }
): RevenueBucket[] {
  const keys =
    args.bucket === 'month'
      ? eachMonthKey(args.fromYmd, args.toYmd)
      : eachDayKey(args.fromYmd, args.toYmd);
  const totals = new Map(keys.map(key => [key, 0]));

  for (const event of events) {
    if (event.createdAt < args.fromIso || event.createdAt > args.toIso) {
      continue;
    }
    const key = eventBucketKey(event.createdAt, args.timeZone, args.bucket);
    if (!key || !totals.has(key)) continue;
    totals.set(key, (totals.get(key) ?? 0) + event.amountCents);
  }

  const labelOptions: BucketLabelOptions = {
    todayYmd: args.todayYmd,
    weekdayTicks: args.weekdayTicks,
  };

  return keys.map(key => ({
    key,
    label: formatBucketLabel(key, args.bucket, labelOptions),
    hoverLabel: formatBucketHoverLabel(key, args.bucket, labelOptions),
    totalCents: totals.get(key) ?? 0,
  }));
}

export function sumRevenueCents(events: RevenueEvent[]): number {
  return events.reduce((sum, event) => sum + event.amountCents, 0);
}

export function revenueSourceTotals(
  events: RevenueEvent[]
): RevenueSourceTotal[] {
  const totals = new Map<PaymentsTransactionSource, number>();
  for (const event of events) {
    if (event.source === 'payout') continue;
    totals.set(
      event.source,
      (totals.get(event.source) ?? 0) + event.amountCents
    );
  }

  return [...totals.entries()]
    .filter(([, cents]) => cents !== 0)
    .sort((a, b) => b[1] - a[1])
    .map(([source, cents]) => ({
      source,
      label: PAYMENTS_REVENUE_SOURCE_LABELS[source],
      cents,
    }));
}

export function revenueChangePercent(
  currentCents: number,
  previousCents: number
): number | null {
  if (previousCents <= 0) return currentCents > 0 ? 100 : null;
  return Math.round(((currentCents - previousCents) / previousCents) * 100);
}
