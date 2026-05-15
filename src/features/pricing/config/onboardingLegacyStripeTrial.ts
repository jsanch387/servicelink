/**
 * Onboarding step 5 billing mode.
 *
 * - Default (unset / false): complete onboarding as Free — no Stripe customer/subscription.
 * - Legacy (`NEXT_PUBLIC_ONBOARDING_LEGACY_STRIPE_TRIAL=true`): start the 7-day Pro trial
 *   via `POST /api/stripe/start-onboarding-trial` (previous behavior).
 *
 * Uses `NEXT_PUBLIC_*` so the same flag is available in client components and API routes.
 */
export function isOnboardingLegacyStripeTrialEnabled(): boolean {
  const raw =
    typeof process.env.NEXT_PUBLIC_ONBOARDING_LEGACY_STRIPE_TRIAL === 'string'
      ? process.env.NEXT_PUBLIC_ONBOARDING_LEGACY_STRIPE_TRIAL.trim().toLowerCase()
      : '';
  return raw === '1' || raw === 'true' || raw === 'yes';
}
