import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';

function wallClock(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

/** "Thu, Nov 12", or "Thu, Nov 12, 2026" when the year is included. */
export function formatBookingDay(
  date: Date,
  locale: PublicBookingFlowLocale,
  withYear = false
): string {
  return new Intl.DateTimeFormat(bcp47ForBookingLocale(locale), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: withYear ? 'numeric' : undefined,
  }).format(date);
}

/** "November 2026" */
export function formatBookingMonth(
  date: Date,
  locale: PublicBookingFlowLocale
): string {
  return new Intl.DateTimeFormat(bcp47ForBookingLocale(locale), {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** "9:00 AM" for the summary. "9 AM" / "9:30 AM" on the slot pills. */
export function formatBookingClock(
  time: string,
  locale: PublicBookingFlowLocale,
  withMinutes: boolean
): string {
  const minutes = Number(time.split(':')[1] ?? 0);
  return new Intl.DateTimeFormat(bcp47ForBookingLocale(locale), {
    hour: 'numeric',
    minute: withMinutes || minutes !== 0 ? '2-digit' : undefined,
  }).format(wallClock(time));
}
