/**
 * Inclusive YYYY-MM-DD window for a membership period visit.
 * Next visit cannot land in a cadence the member already used.
 */

import type { SubscriptionCadenceUnit } from '../types/customerSubscriptionPlan';

export type MembershipVisitDateBounds = {
  minYmd: string;
  maxYmd: string;
};

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseYmd(raw: string | null | undefined): string | null {
  const value = raw?.trim() ?? '';
  if (!YMD_RE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return value;
}

/** Stripe / ISO timestamp → calendar day (UTC date). */
export function isoToYmd(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  if (YMD_RE.test(iso.trim())) return parseYmd(iso.trim());
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function localTodayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ymdToLocalDate(ymd: string): Date | null {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const [y, m, d] = parsed.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function ymdFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysToYmd(ymd: string, deltaDays: number): string | null {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const d = new Date(`${parsed}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return ymdFromLocalDate(d);
}

export function addCadenceToYmd(
  ymd: string,
  unit: SubscriptionCadenceUnit,
  count: number
): string | null {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const n = Math.max(1, count);
  const d = new Date(`${parsed}T12:00:00`);
  if (unit === 'week') {
    d.setDate(d.getDate() + 7 * n);
  } else if (unit === 'year') {
    d.setFullYear(d.getFullYear() + n);
  } else {
    d.setMonth(d.getMonth() + n);
  }
  return ymdFromLocalDate(d);
}

function maxYmd(values: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  for (const value of values) {
    const ymd = parseYmd(value);
    if (!ymd) continue;
    if (!best || ymd > best) best = ymd;
  }
  return best;
}

export function asMembershipCadenceUnit(
  value: string | null | undefined
): SubscriptionCadenceUnit {
  if (value === 'week' || value === 'month' || value === 'year') return value;
  return 'month';
}

export function isYmdInInclusiveRange(
  ymd: string,
  bounds: MembershipVisitDateBounds
): boolean {
  const value = parseYmd(ymd);
  if (!value) return false;
  return value >= bounds.minYmd && value <= bounds.maxYmd;
}

function lastVisitUsedPeriod(args: {
  lastVisit: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}): boolean {
  if (!args.lastVisit || !args.periodStart) return false;
  if (args.lastVisit < args.periodStart) return false;
  if (args.periodEnd && args.lastVisit >= args.periodEnd) return false;
  return true;
}

/**
 * Bookable days for the public period-visit calendar.
 *
 * Window follows the Stripe billing period (next bill), not last visit + cadence.
 * An August visit on a monthly plan does not push the calendar to late September —
 * it opens at period end (next bill), through the following period.
 */
export function resolveMembershipPeriodVisitDateBounds(args: {
  todayYmd: string;
  periodStartIso?: string | null;
  periodEndIso?: string | null;
  lastVisitYmd?: string | null;
  intervalUnit?: string | null;
  intervalCount?: number | null;
}): MembershipVisitDateBounds | null {
  const today = parseYmd(args.todayYmd) ?? localTodayYmd();
  const unit = asMembershipCadenceUnit(args.intervalUnit);
  const count =
    typeof args.intervalCount === 'number' && args.intervalCount >= 1
      ? args.intervalCount
      : 1;
  const periodStart = isoToYmd(args.periodStartIso);
  const periodEnd = isoToYmd(args.periodEndIso);
  const lastVisit = parseYmd(args.lastVisitYmd);
  const usedThisPeriod = lastVisitUsedPeriod({
    lastVisit,
    periodStart,
    periodEnd,
  });

  let windowStart = periodStart;
  let windowEndExclusive = periodEnd;
  if (usedThisPeriod && periodStart) {
    windowStart = periodEnd ?? addCadenceToYmd(periodStart, unit, count);
    windowEndExclusive = windowStart
      ? addCadenceToYmd(windowStart, unit, count)
      : null;
  }

  const minYmd = maxYmd([today, windowStart]);
  if (!minYmd) return null;

  const lastDayOfWindow = windowEndExclusive
    ? addDaysToYmd(windowEndExclusive, -1)
    : null;
  let maxYmdValue =
    lastDayOfWindow && lastDayOfWindow >= minYmd ? lastDayOfWindow : null;
  if (!maxYmdValue) {
    const next = addCadenceToYmd(minYmd, unit, count);
    maxYmdValue = next ? addDaysToYmd(next, -1) : null;
  }
  if (!maxYmdValue || maxYmdValue < minYmd) return null;

  return { minYmd, maxYmd: maxYmdValue };
}
