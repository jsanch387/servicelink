import { computeBookingEarningsCents } from './computeBookingEarningsCents';
import type { RevenueBookingRow } from './computeBookingEarningsCents';
import type { RevenueBucketKind, RevenueRange } from './resolveRevenueRange';
import {
  eachDayKey,
  eachMonthKey,
  formatBucketHoverLabel,
  revenueChangePercent,
  type RevenueBucket,
} from './summarizeRevenue';
import { shiftYmd } from './zonedDateTime';

const WEEKDAY_AXIS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

export interface AggregatePaymentsRevenueResult {
  collectedCents: number;
  previousTotalCents: number;
  changePercent: number | null;
  jobsPaid: number;
  bucketKind: RevenueBucketKind;
  buckets: RevenueBucket[];
}

export function aggregatePaymentsRevenue(args: {
  rows: RevenueBookingRow[];
  range: RevenueRange;
  todayYmd: string;
}): AggregatePaymentsRevenueResult {
  const byDay = new Map<string, number>();
  let collectedCents = 0;
  let previousTotalCents = 0;
  let jobsPaid = 0;

  for (const row of args.rows) {
    const earnings = computeBookingEarningsCents(row);
    if (!earnings) continue;
    const day = earnings.scheduledYmd;
    const inCurrent =
      args.range.unbounded ||
      (day >= args.range.fromYmd && day <= args.range.toYmd);
    if (inCurrent) {
      collectedCents += earnings.collectedCents;
      jobsPaid += 1;
      byDay.set(day, (byDay.get(day) ?? 0) + earnings.collectedCents);
    }
    if (
      args.range.comparePrevious &&
      day >= args.range.previousFromYmd &&
      day <= args.range.previousToYmd
    ) {
      previousTotalCents += earnings.collectedCents;
    }
  }

  return {
    collectedCents,
    previousTotalCents: args.range.comparePrevious ? previousTotalCents : 0,
    changePercent: args.range.comparePrevious
      ? revenueChangePercent(collectedCents, previousTotalCents)
      : null,
    jobsPaid,
    bucketKind: args.range.bucketKind,
    buckets: buildBars(byDay, args.range, args.todayYmd),
  };
}

function buildBars(
  byDay: Map<string, number>,
  range: RevenueRange,
  todayYmd: string
): RevenueBucket[] {
  if (range.period === 'week') {
    return eachDayKey(range.fromYmd, range.toYmd).map(ymd => ({
      key: ymd,
      label: weekdayAxisLabel(ymd),
      hoverLabel: formatBucketHoverLabel(ymd, 'day', { todayYmd }),
      totalCents: byDay.get(ymd) ?? 0,
    }));
  }

  if (range.period === 'month') {
    return monthWeekBars(range.fromYmd, range.toYmd, byDay);
  }

  if (range.period === 'year') {
    const year = range.fromYmd.slice(0, 4);
    return eachMonthKey(`${year}-01-01`, `${year}-12-31`).map(key => ({
      key,
      label: formatBucketHoverLabel(key, 'month').split(' ')[0] ?? key,
      hoverLabel: formatBucketHoverLabel(key, 'month'),
      totalCents: sumDaysInPrefix(byDay, key),
    }));
  }

  if (range.period === 'all') {
    const years = new Set<string>();
    for (const day of byDay.keys()) years.add(day.slice(0, 4));
    if (years.size === 0) years.add(todayYmd.slice(0, 4));
    return [...years].sort().map(year => ({
      key: year,
      label: year,
      hoverLabel: year,
      totalCents: sumDaysInPrefix(byDay, year),
    }));
  }

  if (range.bucketKind === 'daily') {
    return eachDayKey(range.fromYmd, range.toYmd).map(ymd => ({
      key: ymd,
      label: formatBucketHoverLabel(ymd, 'day').replace(/^[A-Za-z]{3}, /, ''),
      hoverLabel: formatBucketHoverLabel(ymd, 'day', { todayYmd }),
      totalCents: byDay.get(ymd) ?? 0,
    }));
  }

  if (range.bucketKind === 'weekly') {
    return customWeekChunkBars(range.fromYmd, range.toYmd, byDay);
  }

  return eachMonthKey(range.fromYmd, range.toYmd).map(key => ({
    key,
    label: formatBucketHoverLabel(key, 'month').split(' ')[0] ?? key,
    hoverLabel: formatBucketHoverLabel(key, 'month'),
    totalCents: sumDaysInPrefix(byDay, key, range.fromYmd, range.toYmd),
  }));
}

function monthWeekBars(
  fromYmd: string,
  toYmd: string,
  byDay: Map<string, number>
): RevenueBucket[] {
  const lastDay = Number(toYmd.slice(8, 10));
  const segments: Array<[number, number]> = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, lastDay],
  ];
  return segments.map(([start, end], index) => {
    const from = ymdWithDay(fromYmd, start);
    const to = ymdWithDay(fromYmd, end);
    return {
      key: `${fromYmd.slice(0, 7)}-w${index + 1}`,
      label: `Wk ${index + 1}`,
      hoverLabel: `${formatMonthDay(from)} – ${formatMonthDay(to)}`,
      totalCents: sumDayRange(byDay, from, to),
    };
  });
}

function customWeekChunkBars(
  fromYmd: string,
  toYmd: string,
  byDay: Map<string, number>
): RevenueBucket[] {
  const bars: RevenueBucket[] = [];
  let cursor = fromYmd;
  while (cursor <= toYmd) {
    const chunkEnd = minYmd(shiftYmd(cursor, 6), toYmd);
    bars.push({
      key: cursor,
      label: formatMonthDay(cursor),
      hoverLabel: `${formatMonthDay(cursor)} – ${formatMonthDay(chunkEnd)}`,
      totalCents: sumDayRange(byDay, cursor, chunkEnd),
    });
    cursor = shiftYmd(chunkEnd, 1);
  }
  return bars;
}

function weekdayAxisLabel(ymd: string): string {
  return WEEKDAY_AXIS[new Date(`${ymd}T12:00:00Z`).getUTCDay()] ?? '';
}

function ymdWithDay(ymd: string, day: number): string {
  return `${ymd.slice(0, 8)}${String(day).padStart(2, '0')}`;
}

function formatMonthDay(ymd: string): string {
  return formatBucketHoverLabel(ymd, 'day').replace(/^[A-Za-z]{3}, /, '');
}

function minYmd(a: string, b: string): string {
  return a <= b ? a : b;
}

function sumDayRange(
  byDay: Map<string, number>,
  fromYmd: string,
  toYmd: string
): number {
  let total = 0;
  for (const [day, cents] of byDay) {
    if (day >= fromYmd && day <= toYmd) total += cents;
  }
  return total;
}

function sumDaysInPrefix(
  byDay: Map<string, number>,
  prefix: string,
  fromYmd?: string,
  toYmd?: string
): number {
  let total = 0;
  for (const [day, cents] of byDay) {
    if (!day.startsWith(prefix)) continue;
    if (fromYmd && day < fromYmd) continue;
    if (toYmd && day > toYmd) continue;
    total += cents;
  }
  return total;
}
