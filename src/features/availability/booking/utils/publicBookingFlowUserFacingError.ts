import type { PublicBookingFlowLocale } from '@/constants/routes';
import { translatePublicBookingApiMessageForDisplay } from '@/libs/i18n/publicBookingUi';

export type PublicBookingFlowErrorKind = 'checkout' | 'booking';

const CHECKOUT_FALLBACK_EN = 'Could not start checkout.';
const BOOKING_FALLBACK_EN = 'Something went wrong. Please try again.';

function looksLikeLeakedStripeOrVendorSecret(text: string): boolean {
  if (/sk_(live|test)_/i.test(text)) return true;
  if (/\brk_live_/i.test(text)) return true;
  if (/\bpm_(live|test)_/i.test(text)) return true;
  if (/\bacct_[A-Za-z0-9]{8,}\b/.test(text)) return true;
  if (/\*{8,}/.test(text)) return true;
  if (/does not have access to account/i.test(text)) return true;
  if (/application access may have been revoked/i.test(text)) return true;
  if (/invalid[_ ]?api[_ ]?key/i.test(text)) return true;
  return false;
}

/**
 * Maps API `error` strings shown in the public booking UI so we never surface
 * Stripe keys, connected account ids, or other vendor internals even if an
 * endpoint regresses.
 */
function fallbackMessage(
  kind: PublicBookingFlowErrorKind,
  locale: PublicBookingFlowLocale
): string {
  const en = kind === 'checkout' ? CHECKOUT_FALLBACK_EN : BOOKING_FALLBACK_EN;
  return translatePublicBookingApiMessageForDisplay(en, locale);
}

export function publicBookingFlowUserFacingError(
  raw: unknown,
  kind: PublicBookingFlowErrorKind,
  locale: PublicBookingFlowLocale = 'en'
): string {
  const fallback = fallbackMessage(kind, locale);

  if (typeof raw !== 'string') return fallback;
  const s = raw.trim();
  if (!s) return fallback;
  if (s.length > 240) return fallback;
  if (looksLikeLeakedStripeOrVendorSecret(s)) return fallback;
  return translatePublicBookingApiMessageForDisplay(s, locale);
}
