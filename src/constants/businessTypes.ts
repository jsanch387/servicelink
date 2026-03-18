/**
 * Business type options used for onboarding and business profile edit.
 * Single source of truth: update here to change options everywhere.
 */

export interface BusinessTypeOption {
  value: string;
  label: string;
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { value: 'Auto & Detailing', label: 'Auto & Detailing' },
  { value: 'Pressure Washing', label: 'Pressure Washing' },
  { value: 'Cleaning Services', label: 'Cleaning Services' },
  { value: 'Trash & Bin Cleaning', label: 'Trash & Bin Cleaning' },
  { value: 'Lawn Care & Landscaping', label: 'Lawn Care & Landscaping' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'Mobile Repair', label: 'Mobile Repair' },
  { value: 'Window Tinting', label: 'Window Tinting' },
  { value: 'Other', label: 'Other' },
];

/**
 * Values from {@link BUSINESS_TYPE_OPTIONS} where collecting vehicle details
 * (year / make / model) on booking is relevant. Keep in sync when adding types.
 */
const VEHICLE_RELATED_BUSINESS_TYPE_VALUES = new Set<string>([
  'Auto & Detailing',
  'Mobile Repair',
]);

/**
 * True when the business’s chosen type (onboarding / profile) is vehicle-related.
 * Matches exact `value` strings from the business type dropdown.
 */
export function isVehicleRelatedBusinessType(
  businessType: string | null | undefined
): boolean {
  if (businessType == null || !businessType.trim()) return false;
  return VEHICLE_RELATED_BUSINESS_TYPE_VALUES.has(businessType.trim());
}

// Note: vehicle details are currently required whenever they are shown in the
// booking form (for all vehicle-related business types). No extra helper for
// \"required\" variants is needed at this time.
