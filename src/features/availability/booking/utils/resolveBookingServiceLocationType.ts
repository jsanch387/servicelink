import type { ServiceLocationMode } from '@/features/business-profile/utils/serviceLocationMode';

export type BookingServiceLocationType = 'mobile' | 'shop';

/** Merges mobile `serviceLocationType` and web `customerServiceLocation` choice fields. */
export function clientServiceLocationChoice(body: {
  serviceLocationType?: unknown;
  customerServiceLocation?: unknown;
}): BookingServiceLocationType | undefined {
  const fromType = body.serviceLocationType;
  if (fromType === 'mobile' || fromType === 'shop') return fromType;

  const fromCustomer = body.customerServiceLocation;
  if (fromCustomer === 'mobile' || fromCustomer === 'shop') return fromCustomer;

  return undefined;
}

export function validateServiceLocationTypeInput(
  raw: unknown,
  businessMode: ServiceLocationMode
):
  | { ok: true; value: BookingServiceLocationType }
  | { ok: false; error: string } {
  if (raw !== 'mobile' && raw !== 'shop') {
    return {
      ok: false,
      error: 'serviceLocationType must be mobile or shop',
    };
  }

  if (raw === 'shop' && businessMode === 'mobile_only') {
    return {
      ok: false,
      error: 'This business does not offer shop service',
    };
  }

  if (raw === 'mobile' && businessMode === 'shop_only') {
    return {
      ok: false,
      error: 'This business only offers shop service',
    };
  }

  return { ok: true, value: raw };
}

/**
 * Value stored on `bookings.service_location_type`.
 * Prefers explicit client choice; falls back to unambiguous business mode; else NULL.
 */
export function resolvePersistedBookingServiceLocationType(params: {
  clientChoice?: BookingServiceLocationType;
  businessMode: ServiceLocationMode;
}): BookingServiceLocationType | null {
  if (params.clientChoice === 'mobile' || params.clientChoice === 'shop') {
    return params.clientChoice;
  }

  if (params.businessMode === 'shop_only') return 'shop';
  if (params.businessMode === 'mobile_only') return 'mobile';

  return null;
}
