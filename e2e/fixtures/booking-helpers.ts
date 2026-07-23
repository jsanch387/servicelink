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

function stickyPrimaryButton(page: Page, name: string | RegExp) {
  return page.getByRole('button', { name }).last();
}

function isOnScheduleCalendar(page: Page): boolean {
  try {
    const url = new URL(page.url());
    return /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId');
  } catch {
    return false;
  }
}

async function waitForScheduleCalendarReady(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
    timeout: 15_000,
  });
}

/** Mobile vs shop when the business offers both (details page or pre-schedule). */
export async function selectServiceLocationIfShown(
  page: Page,
  location: 'mobile' | 'shop' = 'shop'
): Promise<boolean> {
  const heading = page.getByRole('heading', {
    name: /Where (?:should|will) service happen/i,
  });
  if (!(await heading.isVisible().catch(() => false))) {
    return false;
  }

  const locationGroup = page.getByRole('radiogroup', {
    name: /Where (?:should|will) service happen/i,
  });
  const target =
    location === 'mobile'
      ? locationGroup.getByRole('radio', {
          name: /^(?:Mobile|At my address)/i,
        })
      : locationGroup.getByRole('radio', {
          name: /^(?:Shop|At their shop)/i,
        });

  if (await target.isVisible().catch(() => false)) {
    await target.click();
  } else {
    await locationGroup.getByRole('radio').first().click();
  }
  return true;
}

/**
 * Advances service details (price → add-ons → mobile/shop when offered)
 * onto the schedule calendar. Adaptive for services that skip any of those steps.
 */
export async function continueFromServiceDetails(
  page: Page,
  options?: {
    location?: 'mobile' | 'shop';
    /** When add-ons are shown, toggle the first one before continuing. */
    toggleFirstAddOn?: boolean;
  }
): Promise<void> {
  const locationChoice = options?.location ?? 'shop';
  let shouldToggleFirstAddOn = options?.toggleFirstAddOn === true;

  if (!isOnScheduleCalendar(page)) {
    await Promise.race([
      page.waitForURL(
        url =>
          /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId'),
        { timeout: 25_000 }
      ),
      page
        .getByRole('radiogroup', { name: 'Choose a price option' })
        .or(
          page.getByRole('heading', {
            name: /Where (?:should|will) service happen/i,
          })
        )
        .or(page.getByRole('link', { name: 'Date & time' }))
        .or(page.getByRole('button', { name: 'Date & time' }))
        .or(page.getByRole('button', { name: 'Continue' }))
        .first()
        .waitFor({ state: 'visible', timeout: 25_000 }),
    ]);
  }

  for (let guard = 0; guard < 8; guard++) {
    if (isOnScheduleCalendar(page)) {
      // Pre-schedule location for custom jobs / deep links without a prior choice.
      if (await selectServiceLocationIfShown(page, locationChoice)) {
        const cta = stickyPrimaryButton(page, 'Continue');
        await expect(cta).toBeEnabled({ timeout: 10_000 });
        await cta.click();
        continue;
      }
      await waitForScheduleCalendarReady(page);
      return;
    }

    const priceGroup = page.getByRole('radiogroup', {
      name: 'Choose a price option',
    });
    if (await priceGroup.isVisible().catch(() => false)) {
      await priceGroup.getByRole('radio').first().click();
    }

    if (await selectServiceLocationIfShown(page, locationChoice)) {
      const dateAndTime = page
        .getByRole('link', { name: 'Date & time' })
        .or(page.getByRole('button', { name: 'Date & time' }));
      await expect(dateAndTime).toBeEnabled({ timeout: 10_000 });
      await dateAndTime.click();
      await page.waitForURL(
        url =>
          /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId'),
        { timeout: 20_000 }
      );
      continue;
    }

    if (shouldToggleFirstAddOn) {
      const addOnGroup = page.getByRole('group', { name: 'Optional add-ons' });
      if (await addOnGroup.isVisible().catch(() => false)) {
        const firstAddOn = addOnGroup.getByRole('button').first();
        if (await firstAddOn.isVisible().catch(() => false)) {
          await firstAddOn.click();
          shouldToggleFirstAddOn = false;
        }
      }
    }

    const dateAndTime = page
      .getByRole('link', { name: 'Date & time' })
      .or(page.getByRole('button', { name: 'Date & time' }));
    if (await dateAndTime.isVisible().catch(() => false)) {
      await dateAndTime.click();
      await page.waitForURL(
        url =>
          /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId'),
        { timeout: 20_000 }
      );
      continue;
    }

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      continue;
    }

    throw new Error('Could not continue from service details.');
  }

  throw new Error('Stuck advancing service details before the calendar.');
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
  notes?: string;
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
    notes: '',
    ...overrides,
  };
}

/**
 * Fills contact (+ optional location / address / vehicle) until review.
 */
export async function fillCustomerDetailsThroughReview(
  page: Page,
  customer: PublicCustomerFixture = defaultPublicCustomer(),
  options?: { location?: 'mobile' | 'shop' }
): Promise<{ vehicleFieldsShown: boolean; notesFieldShown: boolean }> {
  let vehicleFieldsShown = false;
  let notesFieldShown = false;
  for (let guard = 0; guard < 8; guard++) {
    if (
      await page
        .getByRole('button', { name: 'Confirm Booking' })
        .or(page.getByRole('button', { name: 'Continue to payment' }))
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return { vehicleFieldsShown, notesFieldShown };
    }

    // Location choice (mobile vs shop) — rare fallback if still shown post-schedule
    if (await selectServiceLocationIfShown(page, options?.location ?? 'shop')) {
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
      await page
        .getByPlaceholder('123 Main St', { exact: true })
        .fill(customer.streetAddress!);
      await page.getByPlaceholder('City', { exact: true }).fill(customer.city!);
      await page.getByPlaceholder('ST', { exact: true }).fill(customer.state!);
      await page.getByPlaceholder('78701', { exact: true }).fill(customer.zip!);
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
      vehicleFieldsShown = true;
      await page.getByPlaceholder('2018').fill(customer.vehicleYear!);
      await page.getByPlaceholder('Toyota').fill(customer.vehicleMake!);
      await page.getByPlaceholder('Camry').fill(customer.vehicleModel!);
      const notes = page.getByPlaceholder(/special requests/i);
      if (await notes.isVisible().catch(() => false)) {
        notesFieldShown = true;
        await notes.fill(customer.notes ?? '');
      }
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
      notesFieldShown = true;
      await page
        .getByPlaceholder(/special requests/i)
        .fill(customer.notes ?? '');
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
  options?: {
    serviceName?: string;
    customer?: PublicCustomerFixture;
    location?: 'mobile' | 'shop';
    toggleFirstAddOn?: boolean;
  }
): Promise<void> {
  await openPublicBookFlow(page, slug);
  await selectFirstBookableService(page, options?.serviceName);
  await continueFromServiceDetails(page, {
    location: options?.location,
    toggleFirstAddOn: options?.toggleFirstAddOn,
  });
  await selectFirstAvailableDateAndTime(page);
  await fillCustomerDetailsThroughReview(
    page,
    options?.customer ?? defaultPublicCustomer(),
    { location: options?.location }
  );
  await expect(
    page
      .getByRole('button', { name: 'Confirm Booking' })
      .or(page.getByRole('button', { name: 'Continue to payment' }))
      .first()
  ).toBeVisible({ timeout: 15_000 });
}
