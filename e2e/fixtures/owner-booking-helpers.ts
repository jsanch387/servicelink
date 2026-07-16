import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/constants/routes';
import {
  defaultPublicCustomer,
  fillCustomerDetailsThroughReview,
  selectFirstAvailableDateAndTime,
  type PublicCustomerFixture,
} from './booking-helpers';

const CREATE_BOOKING_PATH = '/api/public/bookings';
const OWNER_BOOKINGS_PATH = '/api/availability/bookings';

export type OwnerBookingApiRow = {
  id: string;
  bookingSource?: 'public' | 'owner' | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerVehicleYear?: string;
  customerVehicleMake?: string;
  customerVehicleModel?: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePriceCents: number | null;
  addonDetails: Array<{
    id: string;
    name: string;
    priceCents: number;
    durationMinutes?: number | null;
  }>;
  notes: string;
  status: string;
};

export type CapturedOwnerBooking = {
  payload: Record<string, unknown>;
  responseStatus: number;
  responseBody: {
    success?: boolean;
    data?: { id?: string };
    error?: string;
  };
};

export function uniqueOwnerBookingCustomer(
  scenario: string,
  overrides?: Partial<PublicCustomerFixture>
): PublicCustomerFixture {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return defaultPublicCustomer({
    fullName: `E2E Owner ${scenario} ${stamp}`,
    email: `e2e.owner.${stamp}@example.com`,
    ...overrides,
  });
}

export async function openNewOwnerAppointment(page: Page): Promise<void> {
  await page.goto(ROUTES.DASHBOARD.BOOKINGS);
  const create = page.getByRole('link', { name: 'New appointment' });
  await expect(create).toBeVisible({ timeout: 20_000 });
  await create.click();
  await expect(
    page.getByRole('heading', { name: 'Create new appointment' })
  ).toBeVisible({ timeout: 20_000 });
}

export async function startCustomOwnerJob(
  page: Page,
  input: { name: string; priceDollars: string; notes?: string }
): Promise<void> {
  await page.getByRole('radio', { name: /Custom job/i }).click();
  await expect(page.getByRole('heading', { name: 'Custom job' })).toBeVisible();
  await page.getByPlaceholder('e.g. Window cleaning').fill(input.name);
  await page.getByPlaceholder('e.g. $100').fill(input.priceDollars);
  if (input.notes) {
    await page
      .getByPlaceholder('Add details or context about this custom job.')
      .fill(input.notes);
  }
  await page.getByRole('button', { name: 'Continue' }).last().click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
    timeout: 20_000,
  });
}

export async function startFirstCatalogOwnerService(page: Page): Promise<{
  selectedPriceOption: boolean;
  selectedAddOn: boolean;
}> {
  await page.getByRole('radio', { name: /From your services/i }).click();

  const serviceButton = page.getByRole('listitem').getByRole('button').first();
  if (!(await serviceButton.isVisible().catch(() => false))) {
    const categoryTabs = page.getByRole('tablist').getByRole('tab');
    const tabCount = await categoryTabs.count();
    for (let index = 0; index < tabCount; index++) {
      await categoryTabs.nth(index).click();
      if (await serviceButton.isVisible().catch(() => false)) break;
    }
  }
  await expect(serviceButton).toBeVisible({ timeout: 10_000 });
  await serviceButton.click();
  await page.getByRole('button', { name: 'Continue' }).last().click();

  await page.waitForURL(
    url =>
      url.pathname.includes('/book/details') ||
      (/\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId')),
    { timeout: 20_000 }
  );

  const currentUrl = new URL(page.url());
  if (
    /\/book\/?$/.test(currentUrl.pathname) &&
    currentUrl.searchParams.has('serviceId')
  ) {
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
      timeout: 20_000,
    });
    return { selectedPriceOption: false, selectedAddOn: false };
  }

  let selectedPriceOption = false;
  const priceGroup = page.getByRole('radiogroup', {
    name: 'Choose a price option',
  });
  if (await priceGroup.isVisible().catch(() => false)) {
    await priceGroup.getByRole('radio').first().click();
    selectedPriceOption = true;
    const continueButton = page
      .getByRole('button', { name: 'Continue' })
      .last();
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }
  }

  let selectedAddOn = false;
  const addOnGroup = page.getByRole('group', { name: 'Optional add-ons' });
  if (await addOnGroup.isVisible().catch(() => false)) {
    const addOn = addOnGroup.getByRole('button').first();
    if (await addOn.isVisible().catch(() => false)) {
      await addOn.click();
      selectedAddOn = true;
    }
  }

  const dateAndTime = page
    .getByRole('link', { name: 'Date & time' })
    .or(page.getByRole('button', { name: 'Date & time' }));
  await Promise.race([
    page
      .waitForURL(
        url =>
          /\/book\/?$/.test(url.pathname) && url.searchParams.has('serviceId'),
        { timeout: 15_000 }
      )
      .catch(() => undefined),
    dateAndTime
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(() => undefined),
  ]);

  const afterDetailsUrl = new URL(page.url());
  if (
    /\/book\/?$/.test(afterDetailsUrl.pathname) &&
    afterDetailsUrl.searchParams.has('serviceId')
  ) {
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
      timeout: 20_000,
    });
    return { selectedPriceOption, selectedAddOn };
  }

  await dateAndTime.first().click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
    timeout: 20_000,
  });
  return { selectedPriceOption, selectedAddOn };
}

export async function completeOwnerBookingDetails(
  page: Page,
  customer: PublicCustomerFixture,
  location: 'mobile' | 'shop'
): Promise<{ vehicleFieldsShown: boolean; notesFieldShown: boolean }> {
  await selectFirstAvailableDateAndTime(page);
  const fieldsShown = await fillCustomerDetailsThroughReview(page, customer, {
    location,
  });
  await expect(
    page.getByRole('button', { name: 'Confirm Booking' })
  ).toBeVisible({ timeout: 20_000 });
  return fieldsShown;
}

export async function submitOwnerBooking(
  page: Page
): Promise<CapturedOwnerBooking> {
  const [request, response] = await Promise.all([
    page.waitForRequest(
      req =>
        req.method() === 'POST' &&
        new URL(req.url()).pathname === CREATE_BOOKING_PATH
    ),
    page.waitForResponse(
      res =>
        res.request().method() === 'POST' &&
        new URL(res.url()).pathname === CREATE_BOOKING_PATH
    ),
    page.getByRole('button', { name: 'Confirm Booking' }).click(),
  ]);

  const responseBody =
    (await response.json()) as CapturedOwnerBooking['responseBody'];
  await expect(
    page.getByRole('heading', { name: 'Appointment created' })
  ).toBeVisible({ timeout: 30_000 });

  return {
    payload: request.postDataJSON() as Record<string, unknown>,
    responseStatus: response.status(),
    responseBody,
  };
}

export async function getOwnerBookings(
  page: Page
): Promise<OwnerBookingApiRow[]> {
  const response = await page.request.get(OWNER_BOOKINGS_PATH);
  if (!response.ok()) {
    throw new Error(
      `Failed to load owner bookings (${response.status()}): ${await response.text()}`
    );
  }
  const body = (await response.json()) as {
    success?: boolean;
    data?: OwnerBookingApiRow[];
  };
  return body.data ?? [];
}

export async function waitForOwnerBooking(
  page: Page,
  bookingId: string
): Promise<OwnerBookingApiRow> {
  let found: OwnerBookingApiRow | undefined;
  await expect
    .poll(
      async () => {
        found = (await getOwnerBookings(page)).find(
          row => row.id === bookingId
        );
        return found?.id;
      },
      { timeout: 20_000 }
    )
    .toBe(bookingId);
  return found!;
}

export async function cancelOwnerBooking(
  page: Page,
  bookingId: string | null
): Promise<void> {
  if (!bookingId) return;
  const response = await page.request.patch(
    `/api/availability/bookings/${encodeURIComponent(bookingId)}`,
    { data: { status: 'cancelled' } }
  );
  if (!response.ok() && response.status() !== 404) {
    console.warn(
      `Failed to cancel E2E booking ${bookingId} (${response.status()})`
    );
  }
}
