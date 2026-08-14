import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import { parseYmd, ymdToLocalDate } from './membershipPeriodVisitDateBounds';
import { formatSubscriberVisitTime } from './ownerSubscriberDisplay';

/** Public visit confirmation: `Tuesday, September 15, 2026 · 9 AM`. */
export function formatMembershipVisitWhen(
  ymd: string,
  time: string,
  locale: PublicBookingFlowLocale = 'en'
): string {
  const parsed = parseYmd(ymd);
  const date = parsed ? ymdToLocalDate(parsed) : null;
  const dateLabel = date
    ? date.toLocaleDateString(bcp47ForBookingLocale(locale), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ymd.trim();
  const timeLabel = formatSubscriberVisitTime(time);
  if (dateLabel && timeLabel) return `${dateLabel} · ${timeLabel}`;
  return dateLabel || timeLabel;
}
