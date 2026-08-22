/**
 * Editable placeholder defaults for onboarding Step 2 (Add a service).
 * Reads from the industry catalog so a new type only needs one catalog row.
 */

import { getIndustryOnboardingCopy } from '@/constants/businessTypes';

export interface PlaceholderServiceDefaults {
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
}

export function getDefaultPlaceholderService(
  businessType?: string | null
): PlaceholderServiceDefaults {
  return getIndustryOnboardingCopy(businessType).firstService;
}
