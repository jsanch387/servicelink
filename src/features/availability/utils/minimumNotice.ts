/**
 * Lead time (`minimum_notice`) helpers for slot filtering and booking validation.
 */

import {
  isValidTimeZone,
  zonedWallTimeToUtc,
} from '@/features/payments/revenue/zonedDateTime';
import {
  isMinimumNoticeValue,
  type MinimumNoticeValue,
} from '../types/availability';

/**
 * Fallback when a public booking request has no IANA timezone.
 * Booking times are floating wall clocks; Vercel `Date` is UTC, which made
 * same-day US afternoon slots look "too soon" (already in the past).
 * Pacific is the westernmost continental US zone so we do not false-reject
 * PT/MT/CT/ET same-day bookings. Prefer the client's `timeZone` when present.
 */
export const DEFAULT_PUBLIC_BOOKING_TIMEZONE = 'America/Los_Angeles';

const NOTICE_TO_MINUTES: Record<MinimumNoticeValue, number> = {
  none: 0,
  '30m': 30,
  '1h': 60,
  '2h': 120,
  '3h': 180,
  '4h': 240,
  '8h': 480,
  '12h': 720,
  '24h': 24 * 60,
  '48h': 48 * 60,
  '72h': 72 * 60,
  '1w': 7 * 24 * 60,
};

/** Minutes of lead time required; unknown/invalid values → 0. */
export function minimumNoticeToMinutes(
  value: string | null | undefined
): number {
  if (!value || !isMinimumNoticeValue(value)) return 0;
  return NOTICE_TO_MINUTES[value];
}

/** Local calendar `YYYY-MM-DD` (not UTC via toISOString). */
export function toLocalYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Local Date for a calendar day + wall-clock `HH:mm`.
 * Uses noon-safe construction for the date part via Y/M/D setters.
 */
export function localDateTimeFromYmdAndHHmm(
  scheduledDateYmd: string,
  startTimeHHmm: string
): Date {
  const [y, mo, d] = scheduledDateYmd.trim().split('-').map(Number);
  const time = startTimeHHmm.trim().slice(0, 5);
  const [h, m] = time.split(':').map(Number);
  return new Date(y ?? 0, (mo ?? 1) - 1, d ?? 1, h ?? 0, m ?? 0, 0, 0);
}

export type SlotLeadTimeOptions = {
  now?: Date;
  /** IANA zone for the floating wall-clock slot. Omit = runtime local TZ. */
  timeZone?: string;
};

export function resolvePublicBookingLeadTimeZone(raw: unknown): string {
  if (typeof raw === 'string') {
    const timeZone = raw.trim();
    if (timeZone && isValidTimeZone(timeZone)) return timeZone;
  }
  return DEFAULT_PUBLIC_BOOKING_TIMEZONE;
}

function slotStartMs(
  scheduledDateYmd: string,
  startTimeHHmm: string,
  timeZone?: string
): number {
  if (timeZone && isValidTimeZone(timeZone)) {
    const time = startTimeHHmm.trim().slice(0, 5);
    const [hours, minutes] = time.split(':').map(Number);
    return zonedWallTimeToUtc(
      scheduledDateYmd.trim(),
      hours ?? 0,
      minutes ?? 0,
      0,
      0,
      timeZone
    ).getTime();
  }
  return localDateTimeFromYmdAndHHmm(scheduledDateYmd, startTimeHHmm).getTime();
}

function normalizeLeadTimeNow(nowOrOptions?: Date | SlotLeadTimeOptions): {
  now: Date;
  timeZone?: string;
} {
  if (!nowOrOptions) return { now: new Date() };
  if (nowOrOptions instanceof Date) return { now: nowOrOptions };
  return {
    now: nowOrOptions.now ?? new Date(),
    timeZone: nowOrOptions.timeZone,
  };
}

/**
 * True when the slot starts at or after (now + lead time).
 * `none` / 0 still blocks times that are already in the past.
 * Pass `timeZone` on the server so wall-clock slots are not read as UTC.
 */
export function isSlotAllowedByLeadTime(
  scheduledDateYmd: string,
  startTimeHHmm: string,
  minimumNotice: string | null | undefined,
  nowOrOptions: Date | SlotLeadTimeOptions = new Date()
): boolean {
  const { now, timeZone } = normalizeLeadTimeNow(nowOrOptions);
  const leadMinutes = minimumNoticeToMinutes(minimumNotice);
  const slotMs = slotStartMs(scheduledDateYmd, startTimeHHmm, timeZone);
  const earliestMs = now.getTime() + leadMinutes * 60 * 1000;
  return slotMs >= earliestMs;
}
