import { expect, test } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import {
  calendarDayButton,
  fetchAvailabilityRow,
  findNextOpenDayYmd,
  restoreTimeOffBlocksViaApi,
  setTimeOffBlocksViaApi,
  snapshotTimeOffBlocksViaApi,
} from '../fixtures/availability-helpers';
import {
  continueFromServiceDetails,
  openPublicBookFlow,
  resolvePublicBusinessId,
  resolvePublicBusinessSlug,
  selectFirstBookableService,
} from '../fixtures/booking-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

test.describe('Availability time off on public booking', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    test.setTimeout(180_000);
    await loginAsOwner(page);
  });

  test('all-day time off disables that day and blocks create booking', async ({
    page,
    browser,
  }) => {
    const slug = await resolvePublicBusinessSlug(page);
    const businessId = await resolvePublicBusinessId(page);
    const row = await fetchAvailabilityRow(page);
    expect(row?.accept_bookings).toBe(true);

    const previousBlocks = await snapshotTimeOffBlocksViaApi(page);
    const openDay = findNextOpenDayYmd(
      row?.weekly_schedule as Record<string, { enabled?: boolean }> | null
    );

    try {
      await setTimeOffBlocksViaApi(page, [
        {
          id: `e2e-all-day-${openDay.ymd}`,
          startDate: openDay.ymd,
          endDate: openDay.ymd,
          allDay: true,
          startTime: '00:00',
          endTime: '23:59',
          title: 'E2E all day',
        },
      ]);

      const saved = await fetchAvailabilityRow(page);
      const savedBlock = (saved?.time_off_blocks ?? []).find(
        b => b.id === `e2e-all-day-${openDay.ymd}`
      );
      expect(savedBlock).toBeTruthy();
      expect(
        savedBlock?.start_date ?? savedBlock?.startDate ?? savedBlock?.date
      ).toBe(openDay.ymd);
      expect(savedBlock?.all_day ?? savedBlock?.allDay).toBe(true);

      const customer = await browser.newPage();
      try {
        await openPublicBookFlow(customer, slug);
        await selectFirstBookableService(customer);
        await continueFromServiceDetails(customer, { location: 'shop' });

        const monthHeading = customer
          .locator('h3')
          .filter({ hasText: /\d{4}/ })
          .first();
        await expect(monthHeading).toBeVisible({ timeout: 15_000 });
        const headingText = ((await monthHeading.textContent()) ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        const openMonthLabel = openDay.date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        // Calendar keeps view synced to the selected (first available) day.
        // When that is still this month, the time-off day is visible and disabled.
        if (
          headingText.replace(/\s/g, '') === openMonthLabel.replace(/\s/g, '')
        ) {
          const dayBtn = calendarDayButton(customer, openDay.dayOfMonth);
          await expect(dayBtn).toBeVisible();
          await expect(dayBtn).toBeDisabled();
        }

        const createRes = await customer.request.post('/api/public/bookings', {
          data: {
            businessSlug: slug,
            businessId,
            serviceName: 'E2E time off probe',
            scheduledDate: openDay.ymd,
            startTime: '10:00',
            durationMinutes: 60,
            serviceLocationType: 'shop',
            customerServiceLocation: 'shop',
            customer: {
              fullName: 'E2E Probe',
              email: 'e2e-time-off-probe@example.com',
              phone: '5551234567',
              streetAddress: '123 Test St',
              unitApt: '',
              city: 'Austin',
              state: 'TX',
              zip: '78701',
              vehicleYear: '',
              vehicleMake: '',
              vehicleModel: '',
              notes: '',
            },
          },
        });
        const createBody = await createRes.json();
        expect(createRes.status(), JSON.stringify(createBody)).toBe(409);
        expect(String((createBody as { error?: string }).error ?? '')).toMatch(
          /not available/i
        );
      } finally {
        await customer.close();
      }
    } finally {
      await restoreTimeOffBlocksViaApi(page, previousBlocks);
    }
  });

  test('timed time off hides morning slots but leaves afternoon open', async ({
    page,
    browser,
  }) => {
    const slug = await resolvePublicBusinessSlug(page);
    const row = await fetchAvailabilityRow(page);
    expect(row?.accept_bookings).toBe(true);

    const previousBlocks = await snapshotTimeOffBlocksViaApi(page);
    const openDay = findNextOpenDayYmd(
      row?.weekly_schedule as Record<string, { enabled?: boolean }> | null
    );

    try {
      await setTimeOffBlocksViaApi(page, [
        {
          id: `e2e-timed-${openDay.ymd}`,
          startDate: openDay.ymd,
          endDate: openDay.ymd,
          allDay: false,
          startTime: '09:00',
          endTime: '12:00',
          title: 'E2E morning off',
        },
      ]);

      const customer = await browser.newPage();
      try {
        await openPublicBookFlow(customer, slug);
        await selectFirstBookableService(customer);
        await continueFromServiceDetails(customer, { location: 'shop' });

        const monthHeading = customer
          .locator('h3')
          .filter({ hasText: /\d{4}/ })
          .first();
        await expect(monthHeading).toBeVisible({ timeout: 15_000 });
        const headingText = ((await monthHeading.textContent()) ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        const openMonthLabel = openDay.date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        // Timed block still leaves afternoon slots, so this day should remain
        // first-available and stay in view.
        expect(headingText.replace(/\s/g, '')).toBe(
          openMonthLabel.replace(/\s/g, '')
        );

        const dayBtn = calendarDayButton(customer, openDay.dayOfMonth);
        await expect(dayBtn).toBeVisible();
        await expect(dayBtn).toBeEnabled();
        await dayBtn.click();

        await expect(
          customer.getByRole('button', { name: /^9(:00)?\s?AM$/i })
        ).toHaveCount(0);
        await expect(
          customer.getByRole('button', { name: /^1(:00)?\s?PM$/i })
        ).toBeVisible({ timeout: 10_000 });
      } finally {
        await customer.close();
      }
    } finally {
      await restoreTimeOffBlocksViaApi(page, previousBlocks);
    }
  });

  test('multi-day all-day range is stored and blocks the start day', async ({
    page,
    browser,
  }) => {
    const slug = await resolvePublicBusinessSlug(page);
    const businessId = await resolvePublicBusinessId(page);
    const row = await fetchAvailabilityRow(page);
    expect(row?.accept_bookings).toBe(true);

    const previousBlocks = await snapshotTimeOffBlocksViaApi(page);
    const start = findNextOpenDayYmd(
      row?.weekly_schedule as Record<string, { enabled?: boolean }> | null
    );
    const endDate = new Date(
      start.date.getFullYear(),
      start.date.getMonth(),
      start.date.getDate() + 2
    );
    const endYmd = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    try {
      await setTimeOffBlocksViaApi(page, [
        {
          id: `e2e-range-${start.ymd}`,
          startDate: start.ymd,
          endDate: endYmd,
          allDay: true,
          startTime: '00:00',
          endTime: '23:59',
          title: 'E2E range',
        },
      ]);

      const saved = await fetchAvailabilityRow(page);
      const savedBlock = (saved?.time_off_blocks ?? []).find(
        b => b.id === `e2e-range-${start.ymd}`
      );
      expect(savedBlock?.end_date ?? savedBlock?.endDate).toBe(endYmd);

      const customer = await browser.newPage();
      try {
        await openPublicBookFlow(customer, slug);
        await selectFirstBookableService(customer);
        await continueFromServiceDetails(customer, { location: 'shop' });

        const monthHeading = customer
          .locator('h3')
          .filter({ hasText: /\d{4}/ })
          .first();
        await expect(monthHeading).toBeVisible({ timeout: 15_000 });
        const headingText = ((await monthHeading.textContent()) ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        const startMonthLabel = start.date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

        if (
          headingText.replace(/\s/g, '') === startMonthLabel.replace(/\s/g, '')
        ) {
          const dayBtn = calendarDayButton(customer, start.dayOfMonth);
          await expect(dayBtn).toBeVisible();
          await expect(dayBtn).toBeDisabled();
        }

        const createRes = await customer.request.post('/api/public/bookings', {
          data: {
            businessSlug: slug,
            businessId,
            serviceName: 'E2E range probe',
            scheduledDate: start.ymd,
            startTime: '10:00',
            durationMinutes: 60,
            serviceLocationType: 'shop',
            customerServiceLocation: 'shop',
            customer: {
              fullName: 'E2E Probe',
              email: 'e2e-time-off-probe@example.com',
              phone: '5551234567',
              streetAddress: '123 Test St',
              unitApt: '',
              city: 'Austin',
              state: 'TX',
              zip: '78701',
              vehicleYear: '',
              vehicleMake: '',
              vehicleModel: '',
              notes: '',
            },
          },
        });
        const createBody = await createRes.json();
        expect(createRes.status(), JSON.stringify(createBody)).toBe(409);
      } finally {
        await customer.close();
      }
    } finally {
      await restoreTimeOffBlocksViaApi(page, previousBlocks);
    }
  });
});
