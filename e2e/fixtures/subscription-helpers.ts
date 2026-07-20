/**
 * E2E test helpers for subscription flows.
 * Provides utilities for testing subscription creation, cancellation, and duplicate prevention.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Navigates to the upgrade page and waits for it to load.
 */
export async function navigateToUpgrade(page: Page): Promise<void> {
  await page.goto('/dashboard/upgrade');
  await page.waitForLoadState('networkidle');
}

/**
 * Checks if the page shows user has Pro access.
 * Looks for common Pro indicators (badge, active subscription message, etc.)
 */
export async function hasProAccess(page: Page): Promise<boolean> {
  // Check for Pro badge or active subscription indicators
  const proBadge = page.locator('text=/Pro|Active|Subscribed/i').first();
  try {
    await proBadge.waitFor({ timeout: 2000, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if user is on free tier.
 */
export async function hasFreeTier(page: Page): Promise<boolean> {
  const freeBadge = page.locator('text=/Free|Upgrade/i').first();
  try {
    await freeBadge.waitFor({ timeout: 2000, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts to start the upgrade flow.
 * Returns true if upgrade button is present and clickable.
 */
export async function attemptUpgradeFlow(page: Page): Promise<{
  upgradeAvailable: boolean;
  redirectedToStripe: boolean;
  blockedWithError: boolean;
  errorMessage?: string;
}> {
  await navigateToUpgrade(page);

  // Look for upgrade buttons
  const upgradeButton = page.locator('button:has-text("Get Pro"), button:has-text("Upgrade"), a:has-text("Get Pro"), a:has-text("Upgrade")').first();

  const upgradeAvailable = await upgradeButton.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (!upgradeAvailable) {
    // Check if already subscribed message is shown
    const alreadySubMessage = await page.locator('text=/already.*subscri/i, text=/manage.*billing/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    return {
      upgradeAvailable: false,
      redirectedToStripe: false,
      blockedWithError: alreadySubMessage,
      errorMessage: alreadySubMessage ? 'Already subscribed' : undefined,
    };
  }

  // Click upgrade button
  await upgradeButton.click();

  // Wait a bit for navigation or error
  await page.waitForTimeout(2000);

  // Check if redirected to Stripe
  const currentUrl = page.url();
  const redirectedToStripe = currentUrl.includes('checkout.stripe.com');

  // Check for error messages
  const errorLocator = page.locator('[role="alert"], .error, text=/error/i, text=/already.*active/i').first();
  const blockedWithError = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);
  
  let errorMessage: string | undefined;
  if (blockedWithError) {
    errorMessage = await errorLocator.textContent().catch(() => undefined);
  }

  return {
    upgradeAvailable: true,
    redirectedToStripe,
    blockedWithError,
    errorMessage,
  };
}

/**
 * Completes Stripe checkout with test card.
 * Assumes already on Stripe checkout page.
 */
export async function completeStripeCheckout(
  page: Page,
  options: {
    cardNumber?: string;
    expiryDate?: string;
    cvc?: string;
    zip?: string;
  } = {}
): Promise<void> {
  const {
    cardNumber = '4242424242424242',
    expiryDate = '12/34',
    cvc = '123',
    zip = '12345',
  } = options;

  // Wait for Stripe checkout to load
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
  await page.waitForLoadState('networkidle');

  // Fill in card details
  // Note: Stripe uses iframes, so we need to wait for them
  await page.waitForTimeout(2000);

  // Try different selectors for Stripe's card fields
  const cardNumberField = page.frameLocator('iframe[name*="cardNumber"], iframe[title*="card number"]').first().locator('input[name="cardnumber"], input[placeholder*="Card number"]');
  const expiryField = page.frameLocator('iframe[name*="cardExpiry"], iframe[title*="expiry"]').first().locator('input[name="exp-date"], input[placeholder*="MM"]');
  const cvcField = page.frameLocator('iframe[name*="cardCvc"], iframe[title*="CVC"]').first().locator('input[name="cvc"], input[placeholder*="CVC"]');
  const zipField = page.locator('input[name="billingPostalCode"], input[placeholder*="ZIP"], input[placeholder*="Postal"]');

  // Fill card details
  await cardNumberField.fill(cardNumber);
  await expiryField.fill(expiryDate);
  await cvcField.fill(cvc);
  
  // ZIP might be outside iframe
  const zipVisible = await zipField.isVisible({ timeout: 2000 }).catch(() => false);
  if (zipVisible) {
    await zipField.fill(zip);
  }

  // Submit form
  const submitButton = page.locator('button[type="submit"]:has-text("Subscribe"), button[type="submit"]:has-text("Pay")').first();
  await submitButton.click();

  // Wait for redirect back to app
  await page.waitForURL(url => !url.includes('stripe.com'), {
    timeout: 30_000,
  });
}

/**
 * Navigates to settings and opens Stripe Customer Portal.
 */
export async function openCustomerPortal(page: Page): Promise<void> {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');

  // Find and click manage subscription button
  const manageButton = page.locator('button:has-text("Manage subscription"), a:has-text("Manage subscription")').first();
  await expect(manageButton).toBeVisible({ timeout: 10_000 });
  
  await manageButton.click();

  // Wait for redirect to Stripe portal
  await expect(page).toHaveURL(/billing\.stripe\.com/);
  await page.waitForLoadState('networkidle');
}

/**
 * Cancels subscription via Stripe Customer Portal.
 * Assumes already on portal page.
 */
export async function cancelSubscriptionInPortal(page: Page): Promise<void> {
  // Click cancel subscription
  const cancelButton = page.locator('button:has-text("Cancel plan"), button:has-text("Cancel subscription")').first();
  await cancelButton.click();

  // Confirm cancellation
  const confirmButton = page.locator('button:has-text("Cancel plan"), button:has-text("Confirm")').first();
  await confirmButton.click();

  // Wait for confirmation
  await page.waitForTimeout(2000);
}

/**
 * Directly calls the API to create a test subscription.
 * Useful for setting up test data.
 * 
 * WARNING: This is for E2E test setup only. Requires valid auth cookies.
 */
export async function createTestSubscriptionViaAPI(
  page: Page,
  options: {
    priceId?: string;
    trial?: boolean;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const response = await page.request.post('/api/stripe/create-checkout-session', {
    data: {
      source: options.trial ? 'onboarding_trial_bridge' : 'upgrade',
      billingInterval: 'month',
    },
  });

  const data = await response.json();
  return data;
}

/**
 * Gets the current subscription status from the settings page.
 */
export async function getSubscriptionStatus(page: Page): Promise<{
  hasPro: boolean;
  status?: string;
  billingInterval?: string;
}> {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');

  // Check for Pro badge or subscription info
  const proIndicator = await page.locator('text=/Pro|Active/i').first().isVisible({ timeout: 2000 }).catch(() => false);
  
  // Try to extract status text
  let status: string | undefined;
  let billingInterval: string | undefined;

  const statusText = await page.locator('text=/status|billing|subscription/i').first().textContent().catch(() => undefined);
  if (statusText) {
    status = statusText.toLowerCase();
    if (status.includes('month')) billingInterval = 'month';
    if (status.includes('year')) billingInterval = 'year';
  }

  return {
    hasPro: proIndicator,
    status,
    billingInterval,
  };
}

/**
 * Waits for webhook to process (after Stripe checkout or cancellation).
 * Polls the settings page to check if subscription status updated.
 */
export async function waitForWebhookProcessing(
  page: Page,
  expectedStatus: 'pro' | 'free',
  options: {
    timeout?: number;
    pollInterval?: number;
  } = {}
): Promise<void> {
  const { timeout = 30_000, pollInterval = 2000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getSubscriptionStatus(page);
    
    if (expectedStatus === 'pro' && status.hasPro) {
      return;
    }
    
    if (expectedStatus === 'free' && !status.hasPro) {
      return;
    }

    await page.waitForTimeout(pollInterval);
    await page.reload();
  }

  throw new Error(`Webhook did not process within ${timeout}ms. Expected status: ${expectedStatus}`);
}
