import { expect, test } from '@playwright/test';
import { walkPublicBookingToReview } from '../fixtures/booking-helpers';

/** Public booking smoke target for this suite. */
const PUBLIC_BOOKING_SLUG = 'blacklabelauto';

test.describe('Public booking flow (blacklabelauto)', () => {
  test('walks service → details → schedule → review without submitting payment', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await walkPublicBookingToReview(page, PUBLIC_BOOKING_SLUG, {
      location: 'shop',
      toggleFirstAddOn: true,
    });

    await expect(page).toHaveURL(new RegExp(`/${PUBLIC_BOOKING_SLUG}/book`));
    await expect(
      page
        .getByRole('button', { name: 'Confirm Booking' })
        .or(page.getByRole('button', { name: 'Continue to payment' }))
        .first()
    ).toBeVisible();

    // Do not confirm or open Stripe — smoke stops on review / payment entry.
    await expect(
      page.getByRole('heading', { name: "You're booked" })
    ).toHaveCount(0);
  });

  test('active sale appears on the review screen', async ({ page }) => {
    test.setTimeout(180_000);

    // Relies on an active sale already configured on blacklabelauto (no Marketing CRUD).
    await walkPublicBookingToReview(page, PUBLIC_BOOKING_SLUG, {
      location: 'shop',
    });

    await expect(page.getByRole('status')).toContainText(/off applies/i, {
      timeout: 15_000,
    });

    await expect(
      page
        .getByRole('button', { name: 'Confirm Booking' })
        .or(page.getByRole('button', { name: 'Continue to payment' }))
        .first()
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "You're booked" })
    ).toHaveCount(0);
  });
});
