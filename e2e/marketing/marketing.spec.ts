import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import {
  createPromoCode,
  createSale,
  deletePromoCode,
  deleteSale,
  fieldByLabel,
  openMarketing,
  openPromoCodesTab,
  openSalesTab,
  primaryFormButton,
  promoRow,
  saleRow,
  uniquePromoCode,
  uniqueSaleName,
} from '../fixtures/marketing-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

test.describe('Marketing dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    await loginAsOwner(page);
    await openMarketing(page);
  });

  test('owner can create, edit, toggle, and delete a promo code', async ({
    page,
  }) => {
    const code = uniquePromoCode();

    try {
      await createPromoCode(page, { code, discountPercent: '20' });

      const row = promoRow(page, code);
      await expect(row).toBeVisible();
      await expect(row).toContainText('20% off');

      const toggle = row.getByRole('switch');
      await expect(toggle).toHaveAttribute('aria-checked', 'true');

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'false', {
        timeout: 10_000,
      });

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'true', {
        timeout: 10_000,
      });

      await row.getByTitle('Edit').click();
      await expect(
        page.getByRole('heading', { name: 'Edit promo code' })
      ).toBeVisible();
      await fieldByLabel(page, 'Amount').fill('25');
      await primaryFormButton(page, 'Save changes').click();

      await expect(
        page.getByRole('heading', { name: 'Marketing', level: 1 })
      ).toBeVisible({ timeout: 15_000 });
      await openPromoCodesTab(page);
      await expect(promoRow(page, code)).toContainText('25% off');

      await row.getByTitle('Delete').click();
      await expect(
        page.getByRole('heading', { name: 'Delete promo code?' })
      ).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
      await expect(promoRow(page, code)).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await deletePromoCode(page, code);
    }
  });

  test('owner can create, edit, toggle, and delete a sale', async ({ page }) => {
    const name = uniqueSaleName('Primary');

    try {
      await openSalesTab(page);
      await createSale(page, { name, discountPercent: '15' });

      const row = saleRow(page, name);
      await expect(row).toBeVisible();
      await expect(row).toContainText('15% off');

      const toggle = row.getByRole('switch');
      await expect(toggle).toHaveAttribute('aria-checked', 'true');

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'false', {
        timeout: 10_000,
      });

      await row.getByTitle('Edit').click();
      await expect(page.getByRole('heading', { name: 'Edit sale' })).toBeVisible();
      await page.getByPlaceholder('4th of July Sale').fill(`${name} Updated`);
      await fieldByLabel(page, 'Amount').fill('20');
      await primaryFormButton(page, 'Save changes').click();

      await expect(
        page.getByRole('heading', { name: 'Marketing', level: 1 })
      ).toBeVisible({ timeout: 15_000 });
      await openSalesTab(page);
      const updatedRow = saleRow(page, `${name} Updated`);
      await expect(updatedRow).toBeVisible();
      await expect(updatedRow).toContainText('20% off');

      await updatedRow.getByTitle('Delete').click();
      await expect(
        page.getByRole('heading', { name: 'Delete sale?' })
      ).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
      await expect(updatedRow).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await deleteSale(page, name);
      await deleteSale(page, `${name} Updated`);
    }
  });

  test('only one sale can be active at a time', async ({ page }) => {
    const saleA = uniqueSaleName('A');
    const saleB = uniqueSaleName('B');

    try {
      await openSalesTab(page);
      await createSale(page, { name: saleA, discountPercent: '10', active: true });

      await openSalesTab(page);
      await createSale(page, { name: saleB, discountPercent: '12', active: true });

      const rowA = saleRow(page, saleA);
      const rowB = saleRow(page, saleB);

      await expect(rowA.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false',
        { timeout: 10_000 }
      );
      await expect(rowB.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    } finally {
      await deleteSale(page, saleA);
      await deleteSale(page, saleB);
    }
  });
});
