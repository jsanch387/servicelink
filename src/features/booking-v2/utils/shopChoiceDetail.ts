import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';

/** Short shop line for the location card, e.g. "1200 S Lamar, Austin". */
export function shopChoiceDetail(
  location: Pick<
    PublicBookingServiceLocation,
    'shopStreet' | 'shopCity' | 'city' | 'shopAddressLabel'
  >
): string | null {
  const street = location.shopStreet.trim();
  const city = (location.shopCity || location.city).trim();
  if (street && city) return `${street}, ${city}`;
  if (street) return street;
  const full = location.shopAddressLabel?.trim();
  return full || null;
}
