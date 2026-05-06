import type { PublicBookingFlowLocale } from '@/constants/routes';

/**
 * Formats `HH:mm` (24h wall time) for display using the booking funnel locale.
 */
export function formatBookingWallTime(
  hhmm: string,
  locale: PublicBookingFlowLocale
): string {
  const [hRaw, mRaw] = hhmm.split(':').map(Number);
  const h = Number.isFinite(hRaw) ? hRaw : 0;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(locale === 'es' ? 'es-US' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
