import { FREE_MAX_PORTFOLIO_IMAGES, PRO_MAX_PORTFOLIO_IMAGES } from '../types';
import { isProAccess } from './isProAccess';

/** Owner row fields used by `isProAccess` (same as other plan gates). */
export type OwnerSubscriptionFieldsForPortfolio = {
  subscription_tier?: string | null;
  subscription_current_period_end?: string | null;
  subscription_status?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
};

/** Max gallery images the owner may persist and show on Pro; Free uses `FREE_MAX_PORTFOLIO_IMAGES`. */
export function maxPortfolioImagesForSubscription(
  owner: OwnerSubscriptionFieldsForPortfolio | null | undefined
): number {
  if (
    !owner ||
    !isProAccess(
      owner.subscription_tier,
      owner.subscription_current_period_end,
      owner.subscription_status,
      owner.stripe_subscription_id,
      owner.stripe_customer_id
    )
  ) {
    return FREE_MAX_PORTFOLIO_IMAGES;
  }
  return PRO_MAX_PORTFOLIO_IMAGES;
}
