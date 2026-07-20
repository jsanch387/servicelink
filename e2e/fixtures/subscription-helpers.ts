/**
 * Subscription E2E helpers — API probes only (no Stripe hosted UI automation).
 */

import type { Page } from '@playwright/test';
import { test } from '@playwright/test';

export type CheckoutApiResult = {
  status: number;
  data: {
    success?: boolean;
    url?: string;
    error?: string;
    code?: string;
  };
};

export async function postCreateCheckoutSession(
  page: Page,
  billingInterval: 'month' | 'year' = 'month'
): Promise<CheckoutApiResult> {
  const response = await page.request.post(
    '/api/stripe/create-checkout-session',
    {
      data: { billingInterval },
    }
  );
  const data = (await response.json()) as CheckoutApiResult['data'];
  return { status: response.status(), data };
}

/**
 * Skips the test unless the logged-in owner is blocked from starting a new
 * subscription (active/trialing Pro). More reliable than scraping Settings UI.
 */
export async function requireProOwnerOrSkip(page: Page): Promise<void> {
  const { data } = await postCreateCheckoutSession(page, 'month');
  if (data.code !== 'DUPLICATE_SUBSCRIPTION_BLOCKED') {
    test.skip(
      true,
      'E2E owner must be an active Pro subscriber (checkout should return DUPLICATE_SUBSCRIPTION_BLOCKED). Free-user flows are manual.'
    );
  }
}
