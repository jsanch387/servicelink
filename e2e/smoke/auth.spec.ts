import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe('Auth smoke', () => {
  test.beforeEach(() => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
  });

  test('owner can log in and open marketing', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/dashboard/marketing');
    await expect(
      page.getByRole('heading', { name: 'Marketing', level: 1 })
    ).toBeVisible();
  });
});
