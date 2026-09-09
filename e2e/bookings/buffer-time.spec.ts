import { expect, test, type Page } from '@playwright/test';
import { loginAsOwner } from '../fixtures/auth';
import {
  calendarDayButton,
  fetchAvailabilityRow,
  fetchPublicBlockedSlots,
  findExistingBufferSeed,
  findNextOpenDayForBufferSeed,
  morningWindowIsOccupied,
  publicTimeSlotButton,
  restoreBufferTimeViaApi,
  restoreMinimumNoticeViaApi,
  setBufferTimeViaUi,
} from '../fixtures/availability-helpers';
import {
  continueFromServiceDetails,
  openPublicBookFlow,
  resolvePublicBusinessId,
  resolvePublicBusinessSlug,
  selectFirstBookableService,
} from '../fixtures/booking-helpers';
import {
  cancelOwnerBooking,
  createOwnerSeedBookingViaApi,
} from '../fixtures/owner-booking-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

function addMinutesHHmm(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

async function openPublicCalendarOnDay(
  customer: Page,
  slug: string,
  day: { date: Date; dayOfMonth: number }
): Promise<void> {
  await openPublicBookFlow(customer, slug);
  await selectFirstBookableService(customer);
  await continueFromServiceDetails(customer, { location: 'shop' });

  const chooseDifferentTime = customer.getByRole('button', {
    name: 'Choose a different time',
  });
  if (await chooseDifferentTime.isVisible().catch(() => false)) {
    await chooseDifferentTime.click();
  }

  const monthLabel = day.date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const monthHeading = customer
      .locator('h3')
      .filter({ hasText: /\d{4}/ })
      .first();
    await expect(monthHeading).toBeVisible({ timeout: 15_000 });
    const headingText = ((await monthHeading.textContent()) ?? '')
      .replace(/\s+/g, ' ')
      .trim();

    if (headingText.replace(/\s/g, '') === monthLabel.replace(/\s/g, '')) {
      const dayBtn = calendarDayButton(customer, day.dayOfMonth);
      await expect(dayBtn).toBeVisible();
      await expect(dayBtn).toBeEnabled();
      await dayBtn.click();
      return;
    }

    await customer.getByRole('button', { name: 'Next month' }).click();
  }

  throw new Error(`Could not open public calendar on ${monthLabel}`);
}

test.describe('Availability buffer time', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    test.setTimeout(180_000);
    await loginAsOwner(page);
  });

  test('owner sets buffer times and public slots skip the gap after a 9am booking', async ({
    page,
    browser,
  }) => {
    const slug = await resolvePublicBusinessSlug(page);
    const businessId = await resolvePublicBusinessId(page);
    const row = await fetchAvailabilityRow(page);
    expect(row?.accept_bookings).toBe(true);

    const previousBuffer = row?.buffer_time ?? 'none';
    const previousNotice = row?.minimum_notice ?? 'none';
    const weeklySchedule = row?.weekly_schedule as Record<
      string,
      { enabled?: boolean; start?: string; end?: string }
    > | null;
    const blocked = await fetchPublicBlockedSlots(page, slug);

    const existingSeed = findExistingBufferSeed(blocked, weeklySchedule);
    let openDay = existingSeed;
    let seedDuration = existingSeed?.durationMinutes ?? 60;
    let bookingId: string | null = null;

    if (!openDay) {
      openDay = findNextOpenDayForBufferSeed(weeklySchedule);
      for (let extra = 0; extra < 14; extra += 1) {
        if (
          !morningWindowIsOccupied(
            blocked,
            openDay.ymd,
            openDay.seedStart,
            60,
            180
          )
        ) {
          break;
        }
        openDay = findNextOpenDayForBufferSeed(weeklySchedule, openDay.date);
      }
      if (
        morningWindowIsOccupied(
          blocked,
          openDay.ymd,
          openDay.seedStart,
          60,
          180
        )
      ) {
        throw new Error(
          'Could not find an open morning without an existing booking for the buffer seed'
        );
      }
      seedDuration = 60;
    }

    const seedStart = openDay.seedStart;
    const seedEnd = addMinutesHHmm(seedStart, seedDuration);
    const thirtyAfter = addMinutesHHmm(seedEnd, 30);
    const hourAfter = addMinutesHHmm(seedEnd, 60);

    try {
      await restoreMinimumNoticeViaApi(page, 'none');

      if (!existingSeed) {
        bookingId = await createOwnerSeedBookingViaApi(page, {
          businessId,
          businessSlug: slug,
          scheduledDate: openDay.ymd,
          startTime: seedStart,
          durationMinutes: seedDuration,
        });
      }

      await setBufferTimeViaUi(page, 'none');
      const noneRow = await fetchAvailabilityRow(page);
      expect(noneRow?.buffer_time).toBe('none');

      const noBufferCustomer = await browser.newPage();
      try {
        await openPublicCalendarOnDay(noBufferCustomer, slug, openDay);
        await expect(
          publicTimeSlotButton(noBufferCustomer, seedStart)
        ).toHaveCount(0);
        await expect(
          publicTimeSlotButton(noBufferCustomer, seedEnd)
        ).toBeVisible({ timeout: 10_000 });
      } finally {
        await noBufferCustomer.close();
      }

      await setBufferTimeViaUi(page, '30m');
      const thirtyRow = await fetchAvailabilityRow(page);
      expect(thirtyRow?.buffer_time).toBe('30m');

      const thirtyCustomer = await browser.newPage();
      try {
        await openPublicCalendarOnDay(thirtyCustomer, slug, openDay);
        await expect(publicTimeSlotButton(thirtyCustomer, seedEnd)).toHaveCount(
          0
        );
        await expect(
          publicTimeSlotButton(thirtyCustomer, thirtyAfter)
        ).toBeVisible({ timeout: 10_000 });
      } finally {
        await thirtyCustomer.close();
      }

      await setBufferTimeViaUi(page, '1h');
      const hourRow = await fetchAvailabilityRow(page);
      expect(hourRow?.buffer_time).toBe('1h');

      const hourCustomer = await browser.newPage();
      try {
        await openPublicCalendarOnDay(hourCustomer, slug, openDay);
        await expect(publicTimeSlotButton(hourCustomer, seedEnd)).toHaveCount(
          0
        );
        await expect(
          publicTimeSlotButton(hourCustomer, thirtyAfter)
        ).toHaveCount(0);
        await expect(publicTimeSlotButton(hourCustomer, hourAfter)).toBeVisible(
          { timeout: 10_000 }
        );

        const createRes = await hourCustomer.request.post(
          '/api/public/bookings',
          {
            data: {
              businessSlug: slug,
              businessId,
              serviceName: 'E2E buffer probe',
              scheduledDate: openDay.ymd,
              startTime: seedEnd,
              durationMinutes: seedDuration,
              serviceLocationType: 'shop',
              customerServiceLocation: 'shop',
              agreedToPolicy: true,
              timeZone: 'America/Chicago',
              customer: {
                fullName: 'E2E Buffer Probe',
                email: 'e2e-buffer-probe@example.com',
                phone: '5551234567',
                streetAddress: '123 Test St',
                unitApt: '',
                city: 'Austin',
                state: 'TX',
                zip: '78701',
                vehicleYear: '2020',
                vehicleMake: 'Toyota',
                vehicleModel: 'Camry',
                petName: '',
                petSpecies: '',
                petBreed: '',
                petSize: '',
                notes: '',
              },
            },
          }
        );
        const createBody = await createRes.json();
        expect(createRes.status(), JSON.stringify(createBody)).toBe(409);
        expect(String((createBody as { error?: string }).error ?? '')).toMatch(
          /just booked|not available|too close/i
        );
      } finally {
        await hourCustomer.close();
      }
    } finally {
      await cancelOwnerBooking(page, bookingId);
      await restoreBufferTimeViaApi(page, previousBuffer);
      await restoreMinimumNoticeViaApi(page, previousNotice);
    }
  });
});
