import { minutesToServiceDurationHHmm } from '@/features/availability/utils/timeOptions';
import type { DashboardQuote } from '../types';

/** Parse `YYYY-MM-DD` as a local calendar date (avoids UTC shift). */
export function parseLocalDateFromYmd(ymd: string | null): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** First `HH:mm` segment from DB `HH:mm` or `HH:mm:ss`. */
export function pickStartTimeHHmm(db: string | null): string | null {
  if (!db?.trim()) return null;
  const m = db.trim().match(/^(\d{2}:\d{2})/);
  return m ? m[1]! : null;
}

export function centsToWholeDollarDigits(cents: number): string {
  return String(Math.max(0, Math.floor(cents / 100)));
}

export function durationPickerValueFromQuote(quote: DashboardQuote): string {
  const v = minutesToServiceDurationHHmm(quote.durationMinutes);
  return v || '01:00';
}
