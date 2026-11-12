import { findBusinessTypeDefinition } from '@/constants/businessTypes';

/** What the service setup asks for, from `business_profiles.business_type`. */
export type BookingV2AssetKind = 'vehicle' | 'pet' | 'none';

/**
 * Known pet types ask for a pet. Known home, property, and personal types
 * ask for nothing here. A missing or unknown type stays on the vehicle form.
 */
export function bookingV2AssetKind(
  businessType: string | null | undefined
): BookingV2AssetKind {
  const definition = findBusinessTypeDefinition(businessType);
  if (!definition) return 'vehicle';
  if (definition.asset.kind === 'pet') return 'pet';
  if (definition.asset.kind === 'vehicle') return 'vehicle';
  return 'none';
}
