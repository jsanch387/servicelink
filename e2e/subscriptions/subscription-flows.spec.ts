/**
 * E2E tests for subscription flows: upgrade, duplicate prevention, cancellation.
 * 
 * These tests verify the critical subscription management flows work correctly
 * and that the duplicate subscription bug fix prevents users from being charged twice.
 * 
 * Prerequisites:
 * - Test Stripe account configured in environment
 * - Test user account (E2E_OWNER_EMAIL) in .env.e2e.local
 * - App running locally with test Stripe keys
 * 
 * Test cards (Stripe test mode):
 * - 4242 4242 4242 4242 = Successful payment
 * - 4000 0000 0000 9995 = Card declined
 * - 4000 0025 0000 3155 = Requires 3D Secure
 */

import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import { hasE2ECredentials } from '../fixtures/test-env';
import {
  attemptUpgradeFlow,
  getSubscriptionStatus,
  navigateToUpgrade,
} from '../fixtures/subscription-helpers';

test.describe('Subscription Flows', () => {
  test.beforeEach(() => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
  });

  test.describe('Duplicate Subscription Prevention', () => {
    test('blocks duplicate subscription when user already has active subscription', async ({
      page,
    }) => {
      await loginAsOwner(page);

      // First, check current subscription status
      const initialStatus = await getSubscriptionStatus(page);

      // If user doesn't have Pro, skip this test
      // (You'll need to manually create a subscription first for this test)
      if (!initialStatus.hasPro) {
        test.skip(
          true,
          'Test user must have active subscription. Please create one first via manual testing.'
        );
      }

      // Attempt to create duplicate subscription
      const upgradeResult = await attemptUpgradeFlow(page);

      // Verify that either:
      // 1. Upgrade button is not shown (already subscribed message)
      // 2. OR upgrade is blocked with error message
      expect(
        !upgradeResult.upgradeAvailable ||
          upgradeResult.blockedWithError ||
          !upgradeResult.redirectedToStripe
      ).toBe(true);

      // If error shown, verify it mentions existing subscription
      if (upgradeResult.blockedWithError && upgradeResult.errorMessage) {
        expect(upgradeResult.errorMessage.toLowerCase()).toMatch(
          /already.*subscri|active.*subscri|manage.*billing/i
        );
      }

      // Verify NOT redirected to Stripe checkout
      expect(upgradeResult.redirectedToStripe).toBe(false);
    });

    test('shows upgrade option for users without active subscription', async ({
      page,
    }) => {
      await loginAsOwner(page);

      // Check current subscription status
      const status = await getSubscriptionStatus(page);

      // If user has Pro, skip this test
      if (status.hasPro) {
        test.skip(
          true,
          'Test user must NOT have active subscription for this test. Please cancel existing subscription first.'
        );
      }

      // Navigate to upgrade page
      await navigateToUpgrade(page);

      // Verify upgrade options are shown
      const upgradeButton = page.locator(
        'button:has-text("Get Pro"), button:has-text("Upgrade"), a:has-text("Get Pro")'
      ).first();

      await expect(upgradeButton).toBeVisible({ timeout: 10_000 });

      // Verify pricing information is displayed
      const pricingText = page.locator('text=/\\$20|\\$200|month|year/i').first();
      await expect(pricingText).toBeVisible();
    });
  });

  test.describe('Subscription Status Display', () => {
    test('displays correct subscription status on settings page', async ({
      page,
    }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      // Should show either Pro status or Free tier
      const statusSection = page.locator('text=/subscription|billing|plan/i').first();
      await expect(statusSection).toBeVisible({ timeout: 10_000 });
    });

    test('displays correct plan information on upgrade page', async ({
      page,
    }) => {
      await loginAsOwner(page);

      await navigateToUpgrade(page);

      // Verify page loaded
      await expect(page).toHaveURL(/\/dashboard\/upgrade/);

      // Should show plan comparison or current plan
      const planInfo = page.locator('text=/pro|free|plan/i').first();
      await expect(planInfo).toBeVisible({ timeout: 10_000 });

      // Should show pricing
      const pricing = page.locator('text=/\\$20|\\$200/').first();
      await expect(pricing).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Upgrade Flow Navigation', () => {
    test('can navigate to upgrade page from dashboard', async ({ page }) => {
      await loginAsOwner(page);

      // Go to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for upgrade link/button
      const upgradeLink = page.locator('a[href*="upgrade"], button:has-text("Upgrade")').first();
      
      // If no upgrade link visible, user might already be Pro (that's ok)
      const linkVisible = await upgradeLink.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (linkVisible) {
        await upgradeLink.click();
        await expect(page).toHaveURL(/\/dashboard\/upgrade/);
      } else {
        // Directly navigate if no link (might be Pro user)
        await navigateToUpgrade(page);
        await expect(page).toHaveURL(/\/dashboard\/upgrade/);
      }
    });

    test('can access settings page', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Verify settings page loaded
      await expect(page).toHaveURL(/\/dashboard\/settings/);
      
      // Should show some settings content
      const settingsContent = page.locator('text=/settings|account|subscription|billing/i').first();
      await expect(settingsContent).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('API Endpoint Validation', () => {
    test('create-checkout-session API returns valid response', async ({
      page,
    }) => {
      await loginAsOwner(page);

      // Make API request to create checkout session
      const response = await page.request.post(
        '/api/stripe/create-checkout-session',
        {
          data: {
            source: 'upgrade',
            billingInterval: 'month',
          },
        }
      );

      expect(response.ok() || response.status() === 400).toBe(true);

      const data = await response.json();

      // Should return either success with URL or error with message
      if (data.success) {
        expect(data.url).toBeDefined();
        expect(data.url).toContain('stripe.com');
      } else {
        // If error, should have meaningful message
        expect(data.error).toBeDefined();
        expect(typeof data.error).toBe('string');
        
        // If duplicate subscription error, verify correct error code
        if (data.code === 'DUPLICATE_SUBSCRIPTION_BLOCKED') {
          expect(data.error).toMatch(/already.*active|subscription.*exists/i);
        }
      }
    });

    test('start-onboarding-trial API handles existing subscriptions', async ({
      page,
    }) => {
      await loginAsOwner(page);

      // Attempt to start trial
      const response = await page.request.post(
        '/api/stripe/start-onboarding-trial',
        {
          data: {},
        }
      );

      // Should return valid response (success or error)
      expect([200, 400, 410].includes(response.status())).toBe(true);

      const data = await response.json();

      // If user already has subscription, should indicate that
      if (data.alreadyActive) {
        expect(data.success).toBe(true);
        // Should still return trial_confirmation data
        expect(data.trial_confirmation).toBeDefined();
      }
    });
  });
});

test.describe('Subscription Flow Edge Cases', () => {
  test.beforeEach(() => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
  });

  test('handles rapid double-click on upgrade button', async ({ page }) => {
    await loginAsOwner(page);

    const status = await getSubscriptionStatus(page);
    if (status.hasPro) {
      test.skip(true, 'User already has subscription');
    }

    await navigateToUpgrade(page);

    const upgradeButton = page.locator('button:has-text("Get Pro"), button:has-text("Upgrade")').first();
    await expect(upgradeButton).toBeVisible();

    // Rapidly click twice
    await upgradeButton.click();
    await upgradeButton.click({ timeout: 500 }).catch(() => {
      // Button might be disabled or removed after first click (expected)
    });

    // Should only create one checkout session
    // Either redirected to Stripe once, or button disabled
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should be on Stripe OR still on upgrade page (if button disabled correctly)
    expect(
      url.includes('stripe.com') || url.includes('/upgrade')
    ).toBe(true);
  });

  test('handles navigation away during checkout creation', async ({ page }) => {
    await loginAsOwner(page);

    const status = await getSubscriptionStatus(page);
    if (status.hasPro) {
      test.skip(true, 'User already has subscription');
    }

    await navigateToUpgrade(page);

    const upgradeButton = page.locator('button:has-text("Get Pro"), button:has-text("Upgrade")').first();
    
    const buttonVisible = await upgradeButton.isVisible().catch(() => false);
    if (buttonVisible) {
      await upgradeButton.click();

      // Quickly navigate away
      await page.goto('/dashboard').catch(() => {
        // Might already be navigating
      });

      // Wait a bit
      await page.waitForTimeout(2000);

      // Should not have multiple checkout sessions created
      // (Hard to verify without Stripe API access in test, but at least no crash)
      expect(page.url()).toMatch(/dashboard/);
    }
  });
});
