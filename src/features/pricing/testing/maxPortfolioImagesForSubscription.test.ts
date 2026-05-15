import { describe, expect, it } from 'vitest';
import { FREE_MAX_PORTFOLIO_IMAGES, PRO_MAX_PORTFOLIO_IMAGES } from '../types';
import { maxPortfolioImagesForSubscription } from '../utils/maxPortfolioImagesForSubscription';

describe('maxPortfolioImagesForSubscription', () => {
  it('returns Free cap when owner is missing or not Pro', () => {
    expect(maxPortfolioImagesForSubscription(null)).toBe(
      FREE_MAX_PORTFOLIO_IMAGES
    );
    expect(maxPortfolioImagesForSubscription(undefined)).toBe(
      FREE_MAX_PORTFOLIO_IMAGES
    );
    expect(
      maxPortfolioImagesForSubscription({
        subscription_tier: 'free',
        subscription_current_period_end: null,
        subscription_status: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(FREE_MAX_PORTFOLIO_IMAGES);
  });

  it('returns Pro cap for active Pro subscription', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(
      maxPortfolioImagesForSubscription({
        subscription_tier: 'pro',
        subscription_current_period_end: future.toISOString(),
        subscription_status: 'active',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
      })
    ).toBe(PRO_MAX_PORTFOLIO_IMAGES);
  });
});
