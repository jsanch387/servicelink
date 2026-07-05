import { formatFullShopAddress } from '@/features/business-profile/utils/businessLocation';
import type { AvailabilityBookingServiceLocationEmail } from './types';

export function buildAvailabilityBookingEmailServiceLocation(params: {
  effectiveType: 'mobile' | 'shop';
  shopAddressLabel: string | null;
  customerStreet?: string;
  customerUnit?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
}): AvailabilityBookingServiceLocationEmail | undefined {
  if (params.effectiveType === 'shop') {
    const formattedAddress = params.shopAddressLabel?.trim();
    if (!formattedAddress) return undefined;
    return { type: 'shop', formattedAddress };
  }

  const street = params.customerStreet?.trim() ?? '';
  const city = params.customerCity?.trim() ?? '';
  const state = params.customerState?.trim() ?? '';
  const zip = params.customerZip?.trim() ?? '';
  const formattedAddress =
    formatFullShopAddress({
      street,
      unit: params.customerUnit,
      city,
      state,
      zip,
    }) ??
    (street || null);
  if (!formattedAddress) return undefined;
  return { type: 'mobile', formattedAddress };
}
