/**
 * Subscription guards (Pro owner).
 *
 * Full Stripe Checkout / Customer Portal flows are manual in test mode.
 * These tests only assert our app APIs block a second subscription and still
 * open the billing portal for an active Pro user.
 *
 * Requires: E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD for a Pro (active) test user.
 */

import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import { hasE2ECredentials } from '../fixtures/test-env';
import {
  postCreateCheckoutSession,
  requireProOwnerOrSkip,
} from '../fixtures/subscription-helpers';

test.describe('Subscription guards (Pro)', () => {
  test.beforeEach(() => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
  });

  test('create-checkout-session blocks a second monthly subscription', async ({
    page,
  }) => {
    await loginAsOwner(page);
    await requireProOwnerOrSkip(page);

    const { status, data } = await postCreateCheckoutSession(page, 'month');

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('DUPLICATE_SUBSCRIPTION_BLOCKED');
    expect(data.url).toBeUndefined();
    expect(String(data.error).toLowerCase()).toMatch(
      /already.*active|subscription|manage|settings|cancel/i
    );
  });

  test('create-checkout-session blocks yearly checkout while monthly Pro is active', async ({
    page,
  }) => {
    await loginAsOwner(page);
    await requireProOwnerOrSkip(page);

    const { status, data } = await postCreateCheckoutSession(page, 'year');

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('DUPLICATE_SUBSCRIPTION_BLOCKED');
    expect(data.url).toBeUndefined();
  });

  test('create-portal-session returns a Stripe portal URL', async ({
    page,
  }) => {
    await loginAsOwner(page);
    await requireProOwnerOrSkip(page);

    const response = await page.request.post(
      '/api/stripe/create-portal-session',
      { data: {} }
    );
    const data = (await response.json()) as {
      success?: boolean;
      url?: string;
      error?: string;
    };

    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.url).toBeDefined();
    expect(data.url).toMatch(/billing\.stripe\.com|stripe\.com/);
  });

  test('Pro visiting /dashboard/upgrade is redirected away (no Get Pro checkout)', async ({
    page,
  }) => {
    await loginAsOwner(page);
    await requireProOwnerOrSkip(page);

    await page.goto('/dashboard/upgrade');
    await page.waitForLoadState('networkidle');

    // Middleware sends active billed Pro users to the main dashboard.
    await expect(page).toHaveURL(/\/dashboard\/?$/, { timeout: 10_000 });
    expect(page.url()).not.toMatch(/checkout\.stripe\.com/);

    const getPro = page.locator(
      'button:has-text("Get Pro"), button:has-text("Upgrade to Pro")'
    );
    await expect(getPro).toHaveCount(0);
  });
});
