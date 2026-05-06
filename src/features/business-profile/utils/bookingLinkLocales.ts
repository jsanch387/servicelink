import type { PublicBookingFlowLocale } from '@/constants/routes';
import { isPublicBookingFlowLocale } from '@/constants/routes';
import { normalizePublicBookingOfferedLocales } from '@/libs/bookingFlowLocale';

export interface BookingLinkLocalesUiState {
  offerSpanish: boolean;
  visitorDefaultLocale: PublicBookingFlowLocale;
}

/**
 * Maps `business_profiles.public_booking_*` columns to dashboard edit UI state.
 */
export function bookingLinkLocalesUiFromProfile(profile: {
  public_booking_locales?: string[] | null;
  public_booking_default_locale?: string | null;
}): BookingLinkLocalesUiState {
  const offered = normalizePublicBookingOfferedLocales(
    profile.public_booking_locales
  );
  const offerSpanish = offered.includes('es');
  let visitorDefaultLocale: PublicBookingFlowLocale = isPublicBookingFlowLocale(
    profile.public_booking_default_locale
  )
    ? profile.public_booking_default_locale
    : 'en';
  if (!offerSpanish) visitorDefaultLocale = 'en';
  else if (!offered.includes(visitorDefaultLocale)) visitorDefaultLocale = 'en';
  return { offerSpanish, visitorDefaultLocale };
}

export function bookingLinkLocalesPersistFromUi(
  ui: BookingLinkLocalesUiState
): {
  public_booking_locales: PublicBookingFlowLocale[];
  public_booking_default_locale: PublicBookingFlowLocale;
} {
  const public_booking_locales: PublicBookingFlowLocale[] = ui.offerSpanish
    ? ['en', 'es']
    : ['en'];
  let public_booking_default_locale = ui.visitorDefaultLocale;
  if (!ui.offerSpanish) public_booking_default_locale = 'en';
  if (!public_booking_locales.includes(public_booking_default_locale)) {
    public_booking_default_locale = 'en';
  }
  return { public_booking_locales, public_booking_default_locale };
}
