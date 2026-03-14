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
  { value: 'Lawn Care & Landscaping', label: 'Lawn Care & Landscaping' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'Mobile Repair', label: 'Mobile Repair' },
  { value: 'Window Tinting', label: 'Window Tinting' },
  { value: 'Other', label: 'Other' },
];
