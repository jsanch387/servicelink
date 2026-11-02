import { describe, expect, it } from 'vitest';
import {
  canOpenPlatformBillingPortal,
  planSectionBillingCtas,
} from '../utils/canOpenPlatformBillingPortal';

const CUS = 'cus_test123';

describe('canOpenPlatformBillingPortal', () => {
  it('is true for active Pro', () => {
    expect(
      canOpenPlatformBillingPortal({
        planId: 'pro',
        stripeCustomerId: CUS,
        subscriptionStatus: 'active',
        billingAction: 'manage',
      })
    ).toBe(true);
  });

  it('is true after a failed payment downgrades the user to Free (past_due)', () => {
    expect(
      canOpenPlatformBillingPortal({
        planId: 'free',
        stripeCustomerId: CUS,
        subscriptionStatus: 'past_due',
        billingAction: 'update_payment',
      })
    ).toBe(true);
  });

  it('is true for past_due even if the customer id is missing', () => {
    expect(
      canOpenPlatformBillingPortal({
        planId: 'free',
        stripeCustomerId: null,
        subscriptionStatus: 'past_due',
        billingAction: 'update_payment',
      })
    ).toBe(true);
  });

  it('is true for any former subscriber who still has a Stripe customer id', () => {
    expect(
      canOpenPlatformBillingPortal({
        planId: 'free',
        stripeCustomerId: CUS,
        subscriptionStatus: 'canceled',
        billingAction: 'checkout',
      })
    ).toBe(true);
  });

  it('is false for Free users who never had a Stripe customer', () => {
    expect(
      canOpenPlatformBillingPortal({
        planId: 'free',
        stripeCustomerId: null,
        subscriptionStatus: null,
        billingAction: 'checkout',
      })
    ).toBe(false);
  });
});

describe('planSectionBillingCtas', () => {
  it('hides Manage subscription for never-subscribed Free users (the pre-fix Pro-only gate)', () => {
    expect(
      planSectionBillingCtas({
        planId: 'free',
        stripeCustomerId: null,
        billingAction: 'checkout',
      })
    ).toEqual(['upgrade']);
  });

  it('keeps Manage subscription after payment failure (Free + past_due)', () => {
    expect(
      planSectionBillingCtas({
        planId: 'free',
        stripeCustomerId: CUS,
        subscriptionStatus: 'past_due',
        billingAction: 'update_payment',
      })
    ).toEqual(['manage']);
  });

  it('lets churned customers manage billing and start a new checkout', () => {
    expect(
      planSectionBillingCtas({
        planId: 'free',
        stripeCustomerId: CUS,
        subscriptionStatus: 'canceled',
        billingAction: 'checkout',
      })
    ).toEqual(['manage', 'upgrade']);
  });

  it('shows only Manage subscription for active Pro', () => {
    expect(
      planSectionBillingCtas({
        planId: 'pro',
        stripeCustomerId: CUS,
        subscriptionStatus: 'active',
        billingAction: 'manage',
      })
    ).toEqual(['manage']);
  });
});
