/**
 * Whether the owner can use one-tap customer Check-in (SMS deep link).
 * Uses only `profiles.subscription_tier` so it stays correct even when
 * `subscription_current_period_end` is unset.
 */
export function hasProCheckInAccessFromTier(
  subscriptionTier: string | null | undefined
): boolean {
  return subscriptionTier === 'pro';
}
