/**
 * Temporary gate for the new 2-step setup.
 *
 * While this list has emails, only those accounts get the new setup.
 * Everyone else keeps the existing 5-step setup.
 * Clear the list to open the new setup for every new signup.
 *
 * Accounts that already started a setup stay on that setup.
 */
export const ONBOARDING_V3_OWNER_EMAILS: readonly string[] = [
  'app.servicelink@gmail.com',
];

export function isOnboardingV3AllowlistActive(): boolean {
  return ONBOARDING_V3_OWNER_EMAILS.length > 0;
}

/** `v3` is the new setup. `v2` is the existing 5-step setup. */
export function onboardingFlowForEmail(
  email: string | null | undefined
): 'v2' | 'v3' {
  if (!isOnboardingV3AllowlistActive()) return 'v3';

  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return 'v2';
  return ONBOARDING_V3_OWNER_EMAILS.some(
    entry => entry.toLowerCase() === normalized
  )
    ? 'v3'
    : 'v2';
}
