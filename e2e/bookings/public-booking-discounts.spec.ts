import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import {
  applyPromoCodeOnCheckout,
  confirmBookingWithoutStripe,
  resolvePublicBusinessSlug,
  walkPublicBookingToReview,
  withDepositsDisabled,
} from '../fixtures/booking-helpers';
import {
  createPromoCode,
  createSale,
  deletePromoCode,
  deleteSale,
  openMarketing,
  openPromoCodesTab,
  openSalesTab,
  uniquePromoCode,
  uniqueSaleName,
} from '../fixtures/marketing-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

test.describe('Public booking discounts', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    test.setTimeout(180_000);
    await loginAsOwner(page);
  });

  test('active sale auto-applies through public booking confirm', async ({
    page,
    browser,
  }) => {
    const saleName = uniqueSaleName('Public');
    const slug = await resolvePublicBusinessSlug(page);

    try {
      await openMarketing(page);
      await openSalesTab(page);
      await createSale(page, {
        name: saleName,
        discountPercent: '15',
        active: true,
      });

      await withDepositsDisabled(page, async () => {
        const customer = await browser.newPage();
        try {
          await walkPublicBookingToReview(customer, slug);

          await expect(customer.getByRole('status')).toContainText(
            `${saleName} — 15% off applies`,
            { timeout: 15_000 }
          );

          await confirmBookingWithoutStripe(customer);

          await expect(customer.getByRole('status')).toContainText(
            `${saleName} — 15% off applies`
          );
          await expect(
            customer.getByRole('heading', { name: "You're booked" })
          ).toBeVisible();
        } finally {
          await customer.close();
        }
      });
    } finally {
      await openMarketing(page);
      await deleteSale(page, saleName);
    }
  });

  test('promo code applies at checkout through public booking confirm', async ({
    page,
    browser,
  }) => {
    const code = uniquePromoCode();
    const slug = await resolvePublicBusinessSlug(page);

    try {
      await openMarketing(page);
      await openPromoCodesTab(page);
      await createPromoCode(page, {
        code,
        discountPercent: '20',
        active: true,
      });

      await withDepositsDisabled(page, async () => {
        const customer = await browser.newPage();
        try {
          await walkPublicBookingToReview(customer, slug);
          await applyPromoCodeOnCheckout(customer, code);

          await expect(
            customer.getByText(`Code ${code} applied`)
          ).toBeVisible();
          await expect(
            customer.getByText(new RegExp(`${code} — 20% off`, 'i')).first()
          ).toBeVisible();

          await confirmBookingWithoutStripe(customer);

          await expect(
            customer.getByRole('heading', { name: "You're booked" })
          ).toBeVisible();
        } finally {
          await customer.close();
        }
      });
    } finally {
      await openMarketing(page);
      await deletePromoCode(page, code);
    }
  });
});
