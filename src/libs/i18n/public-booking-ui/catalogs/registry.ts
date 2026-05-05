import {
  DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE,
  isPublicBookingFlowLocale,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import type { PublicBookingUi } from '../catalogTypes';
import { publicBookingUiEn } from './en';
import { publicBookingUiEs } from './es';

/**
 * All supported UI catalogs. TypeScript requires every `PublicBookingFlowLocale`
 * key — when you add a language, add `fr: publicBookingUiFr` here after creating the file.
 */
export const PUBLIC_BOOKING_UI_CATALOGS: Record<
  PublicBookingFlowLocale,
  PublicBookingUi
> = {
  en: publicBookingUiEn,
  es: publicBookingUiEs,
};

export function publicBookingUi(
  locale: PublicBookingFlowLocale
): PublicBookingUi {
  return (
    PUBLIC_BOOKING_UI_CATALOGS[locale] ??
    PUBLIC_BOOKING_UI_CATALOGS[DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE]
  );
}

/** Safe resolver when the value may come from a query string or cookie. */
export function publicBookingUiFromUnknown(
  locale: string | null | undefined
): PublicBookingUi {
  if (locale && isPublicBookingFlowLocale(locale)) {
    return publicBookingUi(locale);
  }
  return publicBookingUi(DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE);
}
