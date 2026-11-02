/**
 * Temporary Google reviews connect card.
 * Only this account sees Connect on the reviews screen until the rollout opens.
 */
const GOOGLE_REVIEWS_ROLLOUT_EMAIL = 'jesuss387@gmail.com';

export function isGoogleReviewsRolloutEmail(
  email: string | null | undefined
): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return normalized === GOOGLE_REVIEWS_ROLLOUT_EMAIL;
}
