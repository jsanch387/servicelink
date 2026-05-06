import type { PublicBookingFlowLocale } from '@/constants/routes';

/**
 * BCP 47 tags for `Intl` / `toLocaleDateString` per funnel locale.
 * Add a row when you add a `PublicBookingFlowLocale` (e.g. `fr: 'fr-FR'`).
 */
export const PUBLIC_BOOKING_FLOW_BCP47: Record<
  PublicBookingFlowLocale,
  string
> = {
  en: 'en-US',
  es: 'es-US',
};

export function bcp47ForBookingLocale(locale: PublicBookingFlowLocale): string {
  return PUBLIC_BOOKING_FLOW_BCP47[locale] ?? PUBLIC_BOOKING_FLOW_BCP47.en;
}
