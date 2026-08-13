import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { stripeSubscriptionIdFromInvoice } from '../server/membershipStripeHelpers';

describe('stripeSubscriptionIdFromInvoice', () => {
  it('reads legacy top-level subscription string', () => {
    const invoice = {
      subscription: 'sub_legacy',
    } as Stripe.Invoice;
    expect(stripeSubscriptionIdFromInvoice(invoice)).toBe('sub_legacy');
  });

  it('reads parent.subscription_details when legacy is missing (Stripe API 2025+)', () => {
    const invoice = {
      parent: {
        type: 'subscription_details',
        subscription_details: {
          subscription: 'sub_from_parent',
        },
      },
    } as Stripe.Invoice;
    expect(stripeSubscriptionIdFromInvoice(invoice)).toBe('sub_from_parent');
  });

  it('prefers legacy when both are present', () => {
    const invoice = {
      subscription: 'sub_legacy',
      parent: {
        type: 'subscription_details',
        subscription_details: {
          subscription: 'sub_from_parent',
        },
      },
    } as Stripe.Invoice;
    expect(stripeSubscriptionIdFromInvoice(invoice)).toBe('sub_legacy');
  });

  it('returns null when neither is present', () => {
    expect(stripeSubscriptionIdFromInvoice({} as Stripe.Invoice)).toBeNull();
  });
});
