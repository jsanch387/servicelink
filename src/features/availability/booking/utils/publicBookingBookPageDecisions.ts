/**
 * Pure rules for the public V2 `/[slug]/book` experience.
 *
 * These functions are the contract for what customers should see; the Next.js
 * `book/page.tsx` server component should delegate to them so Vitest can lock
 * behavior without rendering the full RSC tree.
 *
 * @see `src/app/[business-slug]/book/page.tsx`
 */

import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  getBusinessBookPath,
  getPublicBusinessProfilePath,
} from '@/constants/routes';

/** Service needs the inline price / add-ons shell before the calendar. */
export function publicBookingServiceRequiresConfigureUi(params: {
  priceOptionsEnabled: boolean | null | undefined;
  priceOptionCount: number;
  addOnCount: number;
}): boolean {
  return (
    Boolean(params.priceOptionsEnabled && params.priceOptionCount > 0) ||
    params.addOnCount > 0
  );
}

/**
 * Business rules for showing `PublicBookingConfigureScheduleFunnel` (configure + calendar in one client shell).
 * Caller still supplies `configureBundle != null` (fetch succeeded) and routing flags.
 */
export function publicBookingShouldRenderConfigureScheduleFunnel(params: {
  needsConfigureStep: boolean;
  skipDetailsFlag: boolean;
  useAvailabilityBooking: boolean;
  hasConfigureBundle: boolean;
  showAvailabilityServicePicker: boolean;
  showNotAcceptingBookings: boolean;
}): boolean {
  const allowInlinePriceConfigure =
    params.needsConfigureStep &&
    !params.skipDetailsFlag &&
    params.useAvailabilityBooking;
  return (
    allowInlinePriceConfigure &&
    params.hasConfigureBundle &&
    !params.showAvailabilityServicePicker &&
    !params.showNotAcceptingBookings
  );
}

export type PublicBookingCalendarTopExitNav = {
  href: string;
  label: string;
};

/**
 * Sticky header “back” on the calendar when there is **no** configure funnel
 * (service has no multi-price and no add-ons). The customer must leave `/book?serviceId=…`
 * entirely — linking to the same schedule URL would trap them on the calendar.
 *
 * - **Public:** marketing profile (`/{slug}` with optional `?lang=`).
 * - **Owner manual booking:** `/[slug]/book?for=owner` service picker.
 */
export function publicBookingCalendarExitNavWithoutConfigureFunnel(params: {
  isOwnerManualBooking: boolean;
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  labels: { backToProfile: string; backToServices: string };
}): PublicBookingCalendarTopExitNav {
  if (params.isOwnerManualBooking) {
    return {
      href: getBusinessBookPath(params.businessSlug, {
        forOwner: true,
        lang: params.bookingFlowLocale,
      }),
      label: params.labels.backToServices,
    };
  }
  return {
    href: getPublicBusinessProfilePath(params.businessSlug, {
      lang: params.bookingFlowLocale,
    }),
    label: params.labels.backToProfile,
  };
}
