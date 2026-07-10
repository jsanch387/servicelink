import type { Page } from '@playwright/test';
import { ROUTES } from '../../src/constants/routes';
import { getE2ETestEnv } from './test-env';

/**
 * Signs in as the dedicated E2E business owner.
 * Requires E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in `.env.e2e.local`.
 */
export async function loginAsOwner(page: Page): Promise<void> {
  const { ownerEmail, ownerPassword } = getE2ETestEnv();

  await page.goto(ROUTES.AUTH.LOGIN);
  await page.getByPlaceholder('you@company.com').fill(ownerEmail);
  await page.getByPlaceholder('Enter your password').fill(ownerPassword);
  await page.getByRole('button', { name: /^login$/i }).click();

  await page.waitForURL(url => !url.pathname.startsWith('/login'), {
    timeout: 30_000,
  });
}
