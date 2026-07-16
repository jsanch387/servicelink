import { expect, type Page, type Response } from '@playwright/test';
import { API_ROUTES, ROUTES } from '../../src/constants/routes';

export const E2E_QUOTE_CUSTOMER_PREFIX = 'E2E Quote Customer';

export type E2EQuoteFixture = {
  marker: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customServiceName: string;
  requestServiceName: string;
  details: string;
};

type QuoteAddonDetail = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
};

export type E2EOwnerQuote = {
  id: string;
  status: string;
  source: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  totalCents: number;
  durationMinutes: number;
  scheduledDate: string | null;
  scheduledTime: string | null;
  serviceId: string | null;
  servicePriceOptionId: string | null;
  servicePriceCents: number | null;
  addonDetails: QuoteAddonDetail[] | null;
  publicToken: string;
};

type QuotesResponse = {
  success?: boolean;
  quotes?: E2EOwnerQuote[];
  error?: string;
};

type SendQuoteResponse = {
  success?: boolean;
  data?: {
    quoteId?: string;
    publicUrl?: string;
    expiresAt?: string;
  };
  error?: string;
};

export function uniqueQuoteFixture(label: string): E2EQuoteFixture {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const marker = `E2E-${label}-${stamp}`;
  return {
    marker,
    customerName: `${E2E_QUOTE_CUSTOMER_PREFIX} ${marker}`,
    customerEmail: `e2e.quote.${stamp}@example.com`,
    customerPhone: '5551234567',
    customServiceName: `E2E Custom Service ${marker}`,
    requestServiceName: `E2E Requested Service ${marker}`,
    details: `Automated E2E quote request ${marker}. Safe to delete.`,
  };
}

export async function getOwnerQuotes(page: Page): Promise<E2EOwnerQuote[]> {
  const response = await page.request.get(API_ROUTES.QUOTES);
  const body = (await response
    .json()
    .catch(() => null)) as QuotesResponse | null;
  if (!response.ok() || !body?.success || !Array.isArray(body.quotes)) {
    throw new Error(
      `Failed to load E2E quotes (${response.status()}): ${body?.error ?? 'invalid response'}`
    );
  }
  return body.quotes;
}

export async function waitForOwnerQuote(
  page: Page,
  customerName: string
): Promise<E2EOwnerQuote> {
  let found: E2EOwnerQuote | undefined;
  await expect
    .poll(
      async () => {
        found = (await getOwnerQuotes(page)).find(
          quote => quote.customerName === customerName
        );
        return found?.id ?? null;
      },
      { timeout: 20_000, message: `Quote for ${customerName} was not found` }
    )
    .not.toBeNull();

  if (!found) throw new Error(`Quote for ${customerName} was not found`);
  return found;
}

export async function deleteOwnerQuote(
  page: Page,
  quoteId: string
): Promise<void> {
  const response = await page.request.delete(API_ROUTES.QUOTE_DETAIL(quoteId));
  if (response.ok() || response.status() === 404) return;
  throw new Error(
    `Failed to delete E2E quote ${quoteId} (${response.status()}): ${await response.text()}`
  );
}

/** Removes leftovers from interrupted runs, but never touches non-E2E rows. */
export async function cleanupStaleE2EQuotes(page: Page): Promise<void> {
  const stale = (await getOwnerQuotes(page)).filter(quote =>
    quote.customerName.startsWith(E2E_QUOTE_CUSTOMER_PREFIX)
  );
  for (const quote of stale) {
    await deleteOwnerQuote(page, quote.id);
  }
}

export async function fillOwnerQuoteCustomer(
  page: Page,
  fixture: E2EQuoteFixture
): Promise<void> {
  await page.getByPlaceholder('e.g. Jordan Lee').fill(fixture.customerName);
  await page.getByPlaceholder('customer@email.com').fill(fixture.customerEmail);
  await page.getByPlaceholder('(555) 123-4567').fill(fixture.customerPhone);
  await page.getByRole('button', { name: 'Continue' }).last().click();

  await expect(page.getByRole('heading', { name: 'Vehicle' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).last().click();
  await expect(page.getByRole('heading', { name: 'Service' })).toBeVisible();
}

export async function chooseCustomQuoteService(
  page: Page,
  fixture: E2EQuoteFixture
): Promise<void> {
  await page.getByRole('radio', { name: /Custom service/i }).click();
  await page
    .getByPlaceholder('e.g. "3 Muddy Razors — full restore"')
    .fill(fixture.customServiceName);
  await page.getByPlaceholder('e.g. $100').fill('125');
  await page
    .getByPlaceholder('Add any notes here for your customer.')
    .fill(`E2E owner note ${fixture.marker}`);
  await page.getByRole('button', { name: 'Continue' }).last().click();
}

/**
 * Selects the first saved service and exercises its first option/add-on when
 * those phases exist. The return flags let the spec assert the matching API
 * snapshots without requiring every E2E account to have identical catalog data.
 */
export async function chooseFirstCatalogQuoteService(
  page: Page
): Promise<{ selectedOption: boolean; selectedAddon: boolean }> {
  const fromServices = page.getByRole('radio', {
    name: /From your services/i,
  });
  // Customer-request rows hydrate their requested text as a custom service.
  // One Back click resets service mode to the custom/catalog chooser.
  if (!(await fromServices.isVisible().catch(() => false))) {
    await expect(
      page.getByPlaceholder('e.g. "3 Muddy Razors — full restore"')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).last().click();
  }
  await fromServices.click();

  const serviceList = page.getByRole('listbox', { name: 'Your services' });
  if (!(await serviceList.isVisible().catch(() => false))) {
    const categoryTabs = page
      .getByRole('tablist', { name: 'Service categories' })
      .getByRole('tab');
    const categoryCount = await categoryTabs.count();
    for (let i = 0; i < categoryCount; i++) {
      await categoryTabs.nth(i).click();
      if ((await serviceList.getByRole('option').count()) > 0) break;
    }
  }
  await expect(serviceList).toBeVisible();
  await serviceList.getByRole('option').first().click();

  let selectedOption = false;
  const optionGroup = page.getByRole('radiogroup', {
    name: 'Choose a price option',
  });
  if (await optionGroup.isVisible().catch(() => false)) {
    await optionGroup.getByRole('radio').first().click();
    selectedOption = true;
  }

  let selectedAddon = false;
  const addonGroup = page.getByRole('group', { name: 'Optional add-ons' });
  if (await addonGroup.isVisible().catch(() => false)) {
    await addonGroup.getByRole('button').first().click();
    selectedAddon = true;
    // Add-ons have a confirmation phase before advancing to schedule.
    await page.getByRole('button', { name: 'Continue' }).last().click();
  }

  await page.getByRole('button', { name: 'Continue' }).last().click();
  return { selectedOption, selectedAddon };
}

export async function chooseCustomerScheduleAndReview(
  page: Page
): Promise<void> {
  await expect(
    page.getByRole('heading', { name: 'Date & time' })
  ).toBeVisible();
  await page.getByRole('radio', { name: /Let customer choose/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Review quote' })
  ).toBeVisible();
  await expect(
    page.getByText('Customer will choose when accepting')
  ).toBeVisible();
}

export async function sendQuoteFromReview(
  page: Page,
  expectedPath: string
): Promise<{ response: Response; body: SendQuoteResponse; payload: unknown }> {
  const responsePromise = page.waitForResponse(
    response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === expectedPath
  );
  await page.getByRole('button', { name: 'Send quote' }).click();
  const response = await responsePromise;
  const body = (await response
    .json()
    .catch(() => null)) as SendQuoteResponse | null;
  if (!body) throw new Error('Quote send returned invalid JSON');

  await expect(page.getByRole('heading', { name: 'Quote sent' })).toBeVisible({
    timeout: 20_000,
  });

  return {
    response,
    body,
    payload: response.request().postDataJSON(),
  };
}

export async function openNewOwnerQuote(page: Page): Promise<void> {
  await page.goto(ROUTES.DASHBOARD.QUOTES_NEW);
  await expect(page.getByRole('heading', { name: 'New Quote' })).toBeVisible();
}

export async function submitPublicQuoteRequest(
  page: Page,
  businessSlug: string,
  fixture: E2EQuoteFixture
): Promise<void> {
  await page.goto(`/${encodeURIComponent(businessSlug)}/quote`);
  await expect(
    page.getByRole('heading', { name: 'Request quote' })
  ).toBeVisible({ timeout: 20_000 });

  await page.getByPlaceholder('Jane Doe').fill(fixture.customerName);
  await page.getByPlaceholder('jane@example.com').fill(fixture.customerEmail);
  await page.getByPlaceholder('(555) 123-4567').fill(fixture.customerPhone);
  await page.getByRole('button', { name: 'Continue' }).last().click();

  const serviceInput = page.getByPlaceholder('e.g. Interior + exterior detail');
  if (!(await serviceInput.isVisible().catch(() => false))) {
    await page.getByPlaceholder('2018').fill('2020');
    await page.getByPlaceholder('Toyota').fill('Toyota');
    await page.getByPlaceholder('Camry').fill('Camry');
    await page.getByRole('button', { name: 'Continue' }).last().click();
  }

  await serviceInput.fill(fixture.requestServiceName);
  await page
    .getByPlaceholder('Share a few details so we can quote accurately.')
    .fill(fixture.details);

  const responsePromise = page.waitForResponse(
    response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === API_ROUTES.PUBLIC_QUOTE_REQUEST
  );
  await page.getByRole('button', { name: 'Submit request' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  await expect(
    page.getByRole('heading', { name: 'Quote request sent' })
  ).toBeVisible();
}
