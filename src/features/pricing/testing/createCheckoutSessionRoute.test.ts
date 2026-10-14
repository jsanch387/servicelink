import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getStripePlatform } from '@/libs/stripe';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { POST } from '@/app/api/stripe/create-checkout-session/route';

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/libs/stripe', () => ({
  getStripePlatform: vi.fn(),
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

const HOSTED_INVOICE_URL = 'https://invoice.stripe.com/i/acct_test/test_secret';
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_new';

function authed(profile: Record<string, unknown> | null) {
  vi.mocked(getAuthenticatedUser).mockResolvedValue({
    authMethod: 'cookie',
    user: {
      id: 'user_1',
      email: 'owner@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00.000Z',
    } as never,
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: profile, error: null }),
          }),
        }),
      }),
    } as never,
  });
}

function stripeClient(overrides?: {
  subscriptions?: Stripe.Subscription[];
  latestInvoice?: Stripe.Invoice | string | null;
  openInvoices?: Stripe.Invoice[];
}) {
  const sessionsCreate = vi.fn().mockResolvedValue({
    id: 'cs_test_new',
    url: CHECKOUT_URL,
  });
  const stripe = {
    subscriptions: {
      list: vi.fn().mockResolvedValue({
        data: overrides?.subscriptions ?? [],
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_past',
        latest_invoice: overrides?.latestInvoice ?? null,
      }),
    },
    invoices: {
      retrieve: vi.fn(),
      list: vi.fn().mockResolvedValue({
        data: overrides?.openInvoices ?? [],
      }),
    },
    prices: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'price_pro_month',
        product: 'prod_pro',
        unit_amount: 2000,
        currency: 'usd',
        recurring: { interval: 'month' },
      }),
    },
    checkout: {
      sessions: { create: sessionsCreate },
    },
  } as unknown as Stripe;

  vi.mocked(getStripePlatform).mockReturnValue(stripe);
  return { stripe, sessionsCreate };
}

function checkoutRequest() {
  return new NextRequest(
    'https://myservicelink.app/api/stripe/create-checkout-session',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: 'myservicelink.app',
      },
      body: JSON.stringify({ billingInterval: 'month', plan: 'pro' }),
    }
  );
}

describe('POST /api/stripe/create-checkout-session', () => {
  const previousPriceId = process.env.STRIPE_PRO_PRICE_ID;

  afterEach(() => {
    process.env.STRIPE_PRO_PRICE_ID = previousPriceId;
    vi.clearAllMocks();
  });

  it('creates a subscription Checkout session for a customer with no open subscription', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_month';
    authed(null);
    const { sessionsCreate } = stripeClient();

    const res = await POST(checkoutRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, url: CHECKOUT_URL });
    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const params = sessionsCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(params.mode).toBe('subscription');
    expect(params).not.toHaveProperty('invoice');
    expect(params.customer_email).toBe('owner@example.com');
  });

  it('reuses the Stripe customer when they have no open subscription', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_month';
    authed({
      stripe_customer_id: 'cus_existing',
      stripe_subscription_id: 'sub_canceled',
      subscription_plan: 'pro',
    });
    const { sessionsCreate } = stripeClient({
      subscriptions: [
        { id: 'sub_canceled', status: 'canceled' } as Stripe.Subscription,
      ],
    });

    const res = await POST(checkoutRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe(CHECKOUT_URL);
    const params = sessionsCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(params.mode).toBe('subscription');
    expect(params.customer).toBe('cus_existing');
    expect(params).not.toHaveProperty('invoice');
  });

  it('returns the open invoice payment URL for a past-due subscription', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_month';
    authed({
      stripe_customer_id: 'cus_past',
      stripe_subscription_id: 'sub_past',
      subscription_plan: 'pro',
    });
    const { sessionsCreate } = stripeClient({
      subscriptions: [
        { id: 'sub_past', status: 'past_due' } as Stripe.Subscription,
      ],
      latestInvoice: {
        id: 'in_open',
        status: 'open',
        amount_due: 2000,
        hosted_invoice_url: HOSTED_INVOICE_URL,
      } as Stripe.Invoice,
    });

    const res = await POST(checkoutRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, url: HOSTED_INVOICE_URL });
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it('does not start a new subscription when the past-due invoice cannot be paid', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_month';
    authed({
      stripe_customer_id: 'cus_past',
      stripe_subscription_id: 'sub_past',
      subscription_plan: 'pro',
    });
    const { sessionsCreate } = stripeClient({
      subscriptions: [
        { id: 'sub_past', status: 'past_due' } as Stripe.Subscription,
      ],
      latestInvoice: {
        id: 'in_open',
        status: 'open',
        amount_due: 2000,
        hosted_invoice_url: null,
      } as Stripe.Invoice,
    });

    const res = await POST(checkoutRequest());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('PAYMENT_RETRY_REQUIRED');
    expect(sessionsCreate).not.toHaveBeenCalled();
  });
});
