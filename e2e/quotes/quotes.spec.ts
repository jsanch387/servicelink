import { expect, test } from '@playwright/test';
import { API_ROUTES, ROUTES } from '../../src/constants/routes';
import { loginAsOwner } from '../fixtures/auth';
import { resolvePublicBusinessSlug } from '../fixtures/booking-helpers';
import {
  chooseCustomerScheduleAndReview,
  chooseCustomQuoteService,
  chooseFirstCatalogQuoteService,
  cleanupStaleE2EQuotes,
  deleteOwnerQuote,
  fillOwnerQuoteCustomer,
  getOwnerQuotes,
  openNewOwnerQuote,
  sendQuoteFromReview,
  submitPublicQuoteRequest,
  uniqueQuoteFixture,
  waitForOwnerQuote,
} from '../fixtures/quote-helpers';
import { hasE2ECredentials } from '../fixtures/test-env';

test.describe.configure({ mode: 'serial' });

test.describe('Quotes core flows', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD in .env.e2e.local'
    );
    test.setTimeout(120_000);
    await loginAsOwner(page);
    await cleanupStaleE2EQuotes(page);
  });

  test('owner sends a custom quote and customer will choose schedule', async ({
    page,
  }) => {
    const fixture = uniqueQuoteFixture('custom');
    let quoteId: string | null = null;

    try {
      await openNewOwnerQuote(page);
      await fillOwnerQuoteCustomer(page, fixture);
      await chooseCustomQuoteService(page, fixture);
      await chooseCustomerScheduleAndReview(page);

      await expect(page.getByText(fixture.customServiceName)).toBeVisible();
      await expect(page.getByText(/^\$125(?:\.00)?$/).first()).toBeVisible();

      const sent = await sendQuoteFromReview(page, API_ROUTES.QUOTE_SEND);
      expect(sent.response.status()).toBe(201);
      expect(sent.body.success).toBe(true);
      expect(sent.body.data?.quoteId).toBeTruthy();
      expect(sent.body.data?.publicUrl).toContain('/q/');
      quoteId = sent.body.data?.quoteId ?? null;

      expect(sent.payload).toMatchObject({
        customerName: fixture.customerName,
        customerEmail: fixture.customerEmail,
        serviceName: fixture.customServiceName,
        priceCents: 12_500,
        durationMinutes: 60,
      });
      expect(sent.payload).not.toHaveProperty('serviceId');
      expect(sent.payload).not.toHaveProperty('scheduledDate');
      expect(sent.payload).not.toHaveProperty('scheduledStartTime');

      const quote = await waitForOwnerQuote(page, fixture.customerName);
      quoteId = quote.id;
      expect(quote).toMatchObject({
        status: 'sent',
        source: 'owner_created',
        serviceName: fixture.customServiceName,
        totalCents: 12_500,
        durationMinutes: 60,
        scheduledDate: null,
        scheduledTime: null,
        serviceId: null,
        servicePriceOptionId: null,
        servicePriceCents: null,
        addonDetails: null,
      });
      expect(quote.publicToken).not.toBe('');

      await page.goto(ROUTES.DASHBOARD.QUOTES);
      const listRow = page
        .getByRole('link')
        .filter({ hasText: fixture.customerName });
      await expect(listRow).toContainText(fixture.customServiceName);
      await expect(listRow).toContainText(/\$125(?:\.00)?/);
      await listRow.click();

      await expect(
        page.getByRole('heading', { name: 'Summary' })
      ).toBeVisible();
      await expect(page.getByText(fixture.customServiceName)).toBeVisible();
      await expect(page.getByText('Not set')).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'View quote' })
      ).toBeVisible();
    } finally {
      if (quoteId) await deleteOwnerQuote(page, quoteId);
    }
  });

  test('customer request is received and first-sent with a catalog service', async ({
    page,
    browser,
  }) => {
    const fixture = uniqueQuoteFixture('request');
    let quoteId: string | null = null;

    try {
      const slug = await resolvePublicBusinessSlug(page);
      const customerPage = await browser.newPage();
      try {
        await submitPublicQuoteRequest(customerPage, slug, fixture);
      } finally {
        await customerPage.close();
      }

      const requested = await waitForOwnerQuote(page, fixture.customerName);
      quoteId = requested.id;
      expect(requested).toMatchObject({
        status: 'requested',
        source: 'customer_requested',
        serviceName: fixture.requestServiceName,
        totalCents: 0,
      });

      await page.goto(ROUTES.DASHBOARD.QUOTES_REQUESTS);
      const requestRow = page
        .getByRole('link')
        .filter({ hasText: fixture.customerName });
      await expect(requestRow).toContainText(fixture.requestServiceName);
      await requestRow.click();
      await expect(page.getByText(fixture.details)).toBeVisible();
      await page.getByRole('link', { name: 'Create quote' }).click();

      await expect(
        page.getByRole('heading', { name: 'Create quote' })
      ).toBeVisible();
      await expect(page.getByPlaceholder('e.g. Jordan Lee')).toHaveValue(
        fixture.customerName
      );
      await page.getByRole('button', { name: 'Continue' }).last().click();
      await page.getByRole('button', { name: 'Continue' }).last().click();

      const catalogSelection = await chooseFirstCatalogQuoteService(page);
      await chooseCustomerScheduleAndReview(page);

      const expectedSendPath = API_ROUTES.QUOTE_SEND_EXISTING(quoteId);
      const sent = await sendQuoteFromReview(page, expectedSendPath);
      expect(sent.response.status()).toBe(200);
      expect(sent.body.success).toBe(true);
      expect(sent.body.data?.quoteId).toBe(quoteId);

      const payload = sent.payload as {
        serviceId?: string;
        servicePriceOptionId?: string;
        servicePriceCents?: number;
        addonDetails?: unknown[];
        scheduledDate?: string;
        scheduledStartTime?: string;
      };
      expect(payload.serviceId).toBeTruthy();
      expect(payload.servicePriceCents).toEqual(expect.any(Number));
      if (catalogSelection.selectedOption) {
        expect(payload.servicePriceOptionId).toBeTruthy();
      }
      if (catalogSelection.selectedAddon) {
        expect(payload.addonDetails?.length).toBeGreaterThan(0);
      }
      expect(payload).not.toHaveProperty('scheduledDate');
      expect(payload).not.toHaveProperty('scheduledStartTime');

      await expect
        .poll(async () => {
          const quote = (await getOwnerQuotes(page)).find(
            q => q.id === quoteId
          );
          return quote?.status;
        })
        .toBe('sent');

      const sentQuote = (await getOwnerQuotes(page)).find(
        q => q.id === quoteId
      );
      expect(sentQuote).toMatchObject({
        source: 'customer_requested',
        status: 'sent',
        scheduledDate: null,
        scheduledTime: null,
      });
      expect(sentQuote?.serviceId).toBeTruthy();
      expect(sentQuote?.servicePriceOptionId).toBe(
        catalogSelection.selectedOption ? payload.servicePriceOptionId : null
      );
      if (catalogSelection.selectedAddon) {
        expect(sentQuote?.addonDetails?.length).toBeGreaterThan(0);
      }
      expect(sentQuote?.publicToken).not.toBe('');

      await page.goto(ROUTES.DASHBOARD.QUOTE_DETAIL(quoteId));
      await expect(page.getByText(fixture.customerName)).toBeVisible();
      await expect(page.getByText('Sent')).toBeVisible();
      await expect(page.getByText('Not set')).toBeVisible();
    } finally {
      if (quoteId) await deleteOwnerQuote(page, quoteId);
    }
  });
});
