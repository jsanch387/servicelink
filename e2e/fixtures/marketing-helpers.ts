import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/constants/routes';

export function uniquePromoCode(): string {
  const suffix = Date.now().toString().slice(-7);
  return `E2E${suffix}`.replace(/[^A-Z0-9]/g, '0');
}

export function uniqueSaleName(label = 'Sale'): string {
  return `E2E ${label} ${Date.now()}`;
}

/** Text input or select tied to a visible label (labels are not wired with htmlFor). */
export function fieldByLabel(page: Page, label: string) {
  return page
    .locator('label')
    .filter({ hasText: label })
    .locator('xpath=..')
    .locator('input, select')
    .first();
}

export async function openMarketing(page: Page): Promise<void> {
  await page.goto(ROUTES.DASHBOARD.MARKETING);
  await expect(
    page.getByRole('heading', { name: 'Marketing', level: 1 })
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'New Promo Code' })
  ).toBeVisible();
}

export async function openPromoCodesTab(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Promo Codes/i }).click();
}

export async function openSalesTab(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Sales/i }).click();
}

export function primaryFormButton(page: Page, name: string | RegExp) {
  return page.getByRole('button', { name }).last();
}

export async function createPromoCode(
  page: Page,
  options: { code: string; discountPercent?: string; active?: boolean }
): Promise<void> {
  const { code, discountPercent = '20', active = true } = options;

  await page.getByRole('link', { name: 'New Promo Code' }).click();
  await expect(
    page.getByRole('heading', { name: 'New promo code' })
  ).toBeVisible();

  await page.getByPlaceholder('NEWUSER').fill(code);
  await fieldByLabel(page, 'Amount').fill(discountPercent);

  const activeSwitch = page.getByRole('switch', { name: 'Active' });
  const isActive = await activeSwitch.getAttribute('aria-checked');
  if ((isActive === 'true') !== active) {
    await activeSwitch.click();
  }

  await primaryFormButton(page, 'Create code').click();
  await expect(page.getByRole('heading', { name: 'Code created' })).toBeVisible(
    {
      timeout: 15_000,
    }
  );
  await page.getByRole('link', { name: 'Back to Marketing' }).click();
  await openMarketing(page);
  await openPromoCodesTab(page);
}

export async function createSale(
  page: Page,
  options: { name: string; discountPercent?: string; active?: boolean }
): Promise<void> {
  const { name, discountPercent = '15', active = true } = options;

  await page.getByRole('link', { name: 'New Sale' }).click();
  await expect(page.getByRole('heading', { name: 'New sale' })).toBeVisible();

  await page.getByPlaceholder('4th of July Sale').fill(name);
  await fieldByLabel(page, 'Amount').fill(discountPercent);

  const activeSwitch = page.getByRole('switch', { name: 'Active' });
  const isActive = await activeSwitch.getAttribute('aria-checked');
  if ((isActive === 'true') !== active) {
    await activeSwitch.click();
  }

  await primaryFormButton(page, 'Create sale').click();
  await expect(page.getByRole('heading', { name: 'Sale created' })).toBeVisible(
    {
      timeout: 15_000,
    }
  );
  await page.getByRole('link', { name: 'Back to Marketing' }).click();
  await openMarketing(page);
  await openSalesTab(page);
}

export function promoRow(page: Page, code: string) {
  return page.getByRole('row').filter({ hasText: code });
}

export function saleRow(page: Page, name: string) {
  return page.getByRole('row').filter({ hasText: name });
}

async function confirmDeleteModal(page: Page): Promise<void> {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete' })
    .click();
}

export async function deletePromoCode(page: Page, code: string): Promise<void> {
  await openMarketing(page);
  await openPromoCodesTab(page);
  const row = promoRow(page, code);
  if ((await row.count()) === 0) return;

  await row.getByTitle('Delete').click();
  await expect(
    page.getByRole('heading', { name: 'Delete promo code?' })
  ).toBeVisible();
  await confirmDeleteModal(page);
  await expect(row).toHaveCount(0, { timeout: 15_000 });
}

export async function deleteSale(page: Page, name: string): Promise<void> {
  await openMarketing(page);
  await openSalesTab(page);
  const row = saleRow(page, name);
  if ((await row.count()) === 0) return;

  await row.getByTitle('Delete').click();
  await expect(
    page.getByRole('heading', { name: 'Delete sale?' })
  ).toBeVisible();
  await confirmDeleteModal(page);
  await expect(row).toHaveCount(0, { timeout: 15_000 });
}
