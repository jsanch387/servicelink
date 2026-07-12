import { expect, type Page } from '@playwright/test';
import { API_ROUTES, getBusinessBookPath } from '../../src/constants/routes';
import { getE2ETestEnv } from './test-env';

const TIME_SLOT_RE = /^\d{1,2}(?::\d{2})?\s?(AM|PM)$/i;

/**
 * Resolves the public business slug from the owner dashboard API when logged in,
 * falling back to `E2E_PUBLIC_BUSINESS_SLUG`.
 */
export async function resolvePublicBusinessSlug(page: Page): Promise<string> {
  const response = await page.request.get('/api/dashboard/data');
  if (response.ok()) {
    const json = (await response.json()) as {
      success?: boolean;
      data?: { slugData?: { slug?: string; hasSlug?: boolean } };
    };
    const slug = json.data?.slugData?.slug?.trim();
    if (slug) return slug;
  }

  const fromEnv = getE2ETestEnv().publicBusinessSlug;
  if (fromEnv) return fromEnv;

  throw new Error(
    'Could not resolve public business slug. Set E2E_PUBLIC_BUSINESS_SLUG in .env.e2e.local or ensure the E2E owner has a public booking link.'
  );
}

/**
 * Temporarily turn off deposits so public booking can Confirm without Stripe.
 * Restores deposits afterward (this E2E account normally uses deposits).
 */
export async function withDepositsDisabled(
  ownerPage: Page,
  run: () => Promise<void>
): Promise<void> {
  const disable = await ownerPage.request.patch(
    API_ROUTES.PAYMENTS_SERVICELINK_SETTINGS,
    { data: { depositsEnabled: false } }
  );
  if (!disable.ok()) {
    const body = await disable.text();
    throw new Error(
      `Failed to disable deposits for E2E (${disable.status()}): ${body}`
    );
  }

  try {
    await run();
  } finally {
    const restore = await ownerPage.request.patch(
      API_ROUTES.PAYMENTS_SERVICELINK_SETTINGS,
      { data: { depositsEnabled: true } }
    );
    if (!restore.ok()) {
      console.warn(
        `Failed to restore deposits after E2E (${restore.status()})`
      );
    }
  }
}

export async function openPublicBookFlow(
  page: Page,
  slug: string
): Promise<void> {
  await page.goto(getBusinessBookPath(slug));
  await expect(page.getByRole('heading', { name: /^Book with /i })).toBeVisible(
    { timeout: 20_000 }
  );
}

/** Picks the first listed service (or a name match when provided). */
export async function selectFirstBookableService(
  page: Page,
  serviceName?: string
): Promise<void> {
  if (serviceName) {
    await page
      .getByRole('listitem')
      .filter({ hasText: new RegExp(serviceName, 'i') })
      .getByRole('button')
      .first()
      .click();
  } else {
    const firstService = page.getByRole('listitem').getByRole('button').first();
    await expect(firstService).toBeVisible({ timeout: 15_000 });
    await firstService.click();
  }

  // Details may redirect straight to the calendar when there is nothing to configure.
  await page.waitForURL(
    url => {
      const path = url.pathname;
      if (path.includes('/book/details')) return true;
      return /\/book\/?$/.test(path) && url.searchParams.has('serviceId');
    },
    { timeout: 20_000 }
  );
}

/**
 * Advances service details (price option / add-ons) onto the schedule calendar.
 * Handles the common case where details client-redirects to `/book?serviceId=…`
 * while briefly showing the booking loader on the details URL.
 */
export async function continueFromServiceDetails(page: Page): Promise<void> {
  const onCalendar = () => {
    try {
      const url = new URL(page.url());
      return (
        /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId')
      );
    } catch {
      return false;
    }
  };

  if (!onCalendar()) {
    // Wait for either calendar navigation (skip-details redirect) or details UI.
    await Promise.race([
      page.waitForURL(
        url =>
          /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId'),
        { timeout: 25_000 }
      ),
      page
        .getByRole('radiogroup', { name: 'Choose a price option' })
        .or(page.getByRole('link', { name: 'Date & time' }))
        .or(page.getByRole('button', { name: 'Date & time' }))
        .or(page.getByRole('button', { name: 'Continue' }))
        .first()
        .waitFor({ state: 'visible', timeout: 25_000 }),
    ]);
  }

  if (onCalendar()) {
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
      timeout: 15_000,
    });
    return;
  }

  const priceGroup = page.getByRole('radiogroup', {
    name: 'Choose a price option',
  });
  if (await priceGroup.isVisible().catch(() => false)) {
    await priceGroup.getByRole('radio').first().click();
  }

  const dateAndTime = page
    .getByRole('link', { name: 'Date & time' })
    .or(page.getByRole('button', { name: 'Date & time' }));
  const continueBtn = page.getByRole('button', { name: 'Continue' });

  if (await dateAndTime.isVisible().catch(() => false)) {
    await dateAndTime.click();
  } else if (await continueBtn.isVisible().catch(() => false)) {
    await continueBtn.click();
    const afterAddOns = page
      .getByRole('link', { name: 'Date & time' })
      .or(page.getByRole('button', { name: 'Date & time' }));
    await expect(afterAddOns).toBeVisible({ timeout: 10_000 });
    await afterAddOns.click();
  } else {
    throw new Error('Could not continue from service details.');
  }

  await page.waitForURL(
    url => /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId'),
    { timeout: 20_000 }
  );
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
    timeout: 15_000,
  });
}

/** Selects the first enabled calendar day that has at least one time slot. */
export async function selectFirstAvailableDateAndTime(
  page: Page
): Promise<void> {
  for (let monthAttempt = 0; monthAttempt < 4; monthAttempt++) {
    const dayButtons = page
      .locator('button:not([disabled])')
      .filter({ hasText: /^\d{1,2}$/ });

    const dayCount = await dayButtons.count();
    for (let i = 0; i < dayCount; i++) {
      await dayButtons.nth(i).click();

      const timeSlot = page
        .locator('button')
        .filter({ hasText: TIME_SLOT_RE })
        .first();
      const hasSlot = await timeSlot
        .isVisible({ timeout: 2_500 })
        .catch(() => false);
      if (!hasSlot) continue;

      await timeSlot.click();
      await stickyPrimaryButton(page, 'Continue').click();
      await expect(
        page.getByRole('heading', {
          name: /Your information|Customer information/i,
        })
      ).toBeVisible({ timeout: 15_000 });
      return;
    }

    await page.getByRole('button', { name: 'Next month' }).click();
  }

  throw new Error('No available date/time slots found in the next few months.');
}

function stickyPrimaryButton(page: Page, name: string | RegExp) {
  return page.getByRole('button', { name }).last();
}

export type PublicCustomerFixture = {
  fullName: string;
  phone: string;
  email: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
};

export function defaultPublicCustomer(
  overrides?: Partial<PublicCustomerFixture>
): PublicCustomerFixture {
  const stamp = Date.now().toString().slice(-6);
  return {
    fullName: `E2E Customer ${stamp}`,
    phone: '5551234567',
    email: `e2e.customer.${stamp}@example.com`,
    streetAddress: '123 Test St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    vehicleYear: '2020',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    ...overrides,
  };
}

/**
 * Fills contact (+ optional location / address / vehicle) until review.
 */
export async function fillCustomerDetailsThroughReview(
  page: Page,
  customer: PublicCustomerFixture = defaultPublicCustomer()
): Promise<void> {
  for (let guard = 0; guard < 8; guard++) {
    if (
      await page
        .getByRole('button', { name: 'Confirm Booking' })
        .or(page.getByRole('button', { name: 'Continue to payment' }))
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }

    // Location choice (mobile vs shop)
    if (
      await page
        .getByRole('heading', { name: /Where should service happen/i })
        .isVisible()
        .catch(() => false)
    ) {
      const locationGroup = page.getByRole('radiogroup', {
        name: /Where should service happen/i,
      });
      const shop = locationGroup.getByRole('radio', { name: /At their shop/i });
      if (await shop.isVisible().catch(() => false)) {
        await shop.click();
      } else {
        await locationGroup
          .getByRole('radio', { name: /At my address/i })
          .click();
      }
      const cta = stickyPrimaryButton(page, 'Continue');
      await expect(cta).toBeEnabled({ timeout: 10_000 });
      await cta.click();
      continue;
    }

    // Contact
    if (
      await page
        .getByPlaceholder('Jane Doe')
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByPlaceholder('Jane Doe').fill(customer.fullName);
      await page.getByPlaceholder('(555) 123-4567').fill(customer.phone);
      const email = page.getByPlaceholder('jane@example.com');
      if (await email.isVisible().catch(() => false)) {
        await email.fill(customer.email);
      }
      const cta = stickyPrimaryButton(page, /^(Continue|Review Booking)$/);
      await expect(cta).toBeEnabled({ timeout: 10_000 });
      await cta.click();
      continue;
    }

    // Address
    if (
      await page
        .getByPlaceholder('123 Main St')
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByPlaceholder('123 Main St').fill(customer.streetAddress!);
      await page.getByPlaceholder('City').fill(customer.city!);
      await page.getByPlaceholder('ST').fill(customer.state!);
      await page.getByPlaceholder('78701').fill(customer.zip!);
      const cta = stickyPrimaryButton(page, /^(Continue|Review Booking)$/);
      await expect(cta).toBeEnabled({ timeout: 10_000 });
      await cta.click();
      continue;
    }

    // Vehicle
    if (
      await page
        .getByPlaceholder('2018')
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByPlaceholder('2018').fill(customer.vehicleYear!);
      await page.getByPlaceholder('Toyota').fill(customer.vehicleMake!);
      await page.getByPlaceholder('Camry').fill(customer.vehicleModel!);
      const cta = stickyPrimaryButton(page, /^(Continue|Review Booking)$/);
      await expect(cta).toBeEnabled({ timeout: 10_000 });
      await cta.click();
      continue;
    }

    // Notes-only vehicleNotes step (no vehicle fields)
    if (
      await page
        .getByPlaceholder(/special requests/i)
        .isVisible()
        .catch(() => false)
    ) {
      await stickyPrimaryButton(page, /^(Continue|Review Booking)$/).click();
      continue;
    }

    throw new Error(
      'Stuck in customer details: unrecognized step before review.'
    );
  }

  throw new Error(
    'Could not reach review step after filling customer details.'
  );
}

async function preferPayInPerson(page: Page): Promise<void> {
  const payInPerson = page
    .getByRole('radio', { name: /Pay in person/i })
    .or(page.getByRole('button', { name: /Pay in person/i }));
  if (
    await payInPerson
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await payInPerson.first().click();
  }
}

/** Applies a promo on review (no payment step) or payment step. */
export async function applyPromoCodeOnCheckout(
  page: Page,
  code: string
): Promise<void> {
  const continueToPayment = page.getByRole('button', {
    name: 'Continue to payment',
  });
  if (await continueToPayment.isVisible().catch(() => false)) {
    await continueToPayment.click();
    await expect(page.getByRole('heading', { name: /^Payment$/i })).toBeVisible(
      { timeout: 15_000 }
    );
  }

  await preferPayInPerson(page);

  await page.getByPlaceholder('Enter code').fill(code);
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText(`Code ${code} applied`)).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Confirms the booking without Stripe when possible.
 * Throws if the only path is a paid Stripe redirect.
 */
export async function confirmBookingWithoutStripe(page: Page): Promise<void> {
  const continueToPayment = page.getByRole('button', {
    name: 'Continue to payment',
  });
  if (await continueToPayment.isVisible().catch(() => false)) {
    await continueToPayment.click();
    await expect(page.getByRole('heading', { name: /^Payment$/i })).toBeVisible(
      { timeout: 15_000 }
    );
  }

  await preferPayInPerson(page);

  const confirm = page.getByRole('button', { name: 'Confirm Booking' });
  const payNow = page.getByRole('button', { name: /^Pay \$/ });

  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  } else if (await payNow.isVisible().catch(() => false)) {
    throw new Error(
      'Public booking requires Stripe Checkout (card due now). Prefer in-person / deposits-off / payments-off on the E2E business.'
    );
  } else {
    throw new Error('No Confirm Booking CTA found on review/payment.');
  }

  await expect(
    page.getByRole('heading', { name: "You're booked" })
  ).toBeVisible({ timeout: 30_000 });
}

/** Full public funnel through schedule + customer details (stops on review). */
export async function walkPublicBookingToReview(
  page: Page,
  slug: string,
  options?: { serviceName?: string; customer?: PublicCustomerFixture }
): Promise<void> {
  await openPublicBookFlow(page, slug);
  await selectFirstBookableService(page, options?.serviceName);
  await continueFromServiceDetails(page);
  await selectFirstAvailableDateAndTime(page);
  await fillCustomerDetailsThroughReview(
    page,
    options?.customer ?? defaultPublicCustomer()
  );
  await expect(
    page
      .getByRole('button', { name: 'Confirm Booking' })
      .or(page.getByRole('button', { name: 'Continue to payment' }))
      .first()
  ).toBeVisible({ timeout: 15_000 });
}
