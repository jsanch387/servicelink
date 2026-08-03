import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import {
  calendarDayButton,
  fetchAvailabilityRow,
  restoreMinimumNoticeViaApi,
  setLeadTimeViaUi,
} from '../fixtures/availability-helpers';
import {
  continueFromServiceDetails,
  openPublicBookFlow,
  resolvePublicBusinessSlug,
  selectFirstBookableService,
} from '../fixtures/booking-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

test.describe('Availability lead time', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    test.setTimeout(180_000);
    await loginAsOwner(page);
  });

  test('owner sets lead time and public calendar hides too-soon days', async ({
    page,
    browser,
  }) => {
    const slug = await resolvePublicBusinessSlug(page);
    const before = await fetchAvailabilityRow(page);
    const previousNotice = before?.minimum_notice ?? 'none';

    try {
      // Baseline without lead time — today should often be bookable on a weekday.
      await setLeadTimeViaUi(page, 'none');

      const baselineCustomer = await browser.newPage();
      let todayBookableWithoutLead = false;
      try {
        await openPublicBookFlow(baselineCustomer, slug);
        await selectFirstBookableService(baselineCustomer);
        await continueFromServiceDetails(baselineCustomer, {
          location: 'shop',
        });
        const todayBtn = calendarDayButton(
          baselineCustomer,
          new Date().getDate()
        );
        await expect(todayBtn).toBeVisible({ timeout: 15_000 });
        todayBookableWithoutLead = !(await todayBtn.isDisabled());
      } finally {
        await baselineCustomer.close();
      }

      // Owner sets 1-day lead time in Availability settings.
      await setLeadTimeViaUi(page, '24h');
      const saved = await fetchAvailabilityRow(page);
      expect(saved?.minimum_notice).toBe('24h');

      const customer = await browser.newPage();
      try {
        await openPublicBookFlow(customer, slug);
        await selectFirstBookableService(customer);
        await continueFromServiceDetails(customer, { location: 'shop' });

        const todayBtn = calendarDayButton(customer, new Date().getDate());
        await expect(todayBtn).toBeVisible({ timeout: 15_000 });
        await expect(todayBtn).toBeDisabled();

        expect(
          todayBookableWithoutLead,
          'Expected today to be bookable with no lead time so the disabled-day assertion proves lead time (not just a day off)'
        ).toBe(true);
      } finally {
        await customer.close();
      }
    } finally {
      await restoreMinimumNoticeViaApi(page, previousNotice);
    }
  });
});
