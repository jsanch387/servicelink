import { SLUG_MAX_LENGTH } from '@/constants/slug';
import { slugFromBusinessName } from '@/features/onboarding-preview/slugPreview';

/** attempt 0 is the base slug. Later attempts append 2, 3, and so on. */
export function onboardingSlugCandidate(base: string, attempt: number): string {
  const clean = slugFromBusinessName(base);
  if (attempt <= 0) return clean;
  const suffix = String(attempt + 1);
  return `${clean.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
}
