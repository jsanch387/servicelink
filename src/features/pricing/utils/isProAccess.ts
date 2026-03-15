/**
 * Determines if the user has effective Pro access.
 * Pro access = subscription_tier is 'pro' AND the current period has not ended.
 * Use this everywhere we gate Pro features (verified badge, 8 images, unlimited bookings).
 */
export function isProAccess(
  subscriptionTier: string | null | undefined,
  subscriptionCurrentPeriodEnd: string | null | undefined
): boolean {
  if (subscriptionTier !== 'pro') return false;
  if (!subscriptionCurrentPeriodEnd) return true; // no end date = treat as Pro (e.g. legacy)
  try {
    const end = new Date(subscriptionCurrentPeriodEnd);
    return !isNaN(end.getTime()) && end > new Date();
  } catch {
    return true;
  }
}
