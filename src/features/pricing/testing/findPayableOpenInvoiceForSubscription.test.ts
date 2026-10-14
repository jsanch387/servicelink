import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { findPayableOpenInvoiceForSubscription } from '../server/findOpenInvoiceForSubscriptionResume';

const HOSTED_URL = 'https://invoice.stripe.com/i/acct_test/test_secret';

function invoice(
  overrides: Partial<Stripe.Invoice> & Pick<Stripe.Invoice, 'id'>
): Stripe.Invoice {
  return {
    status: 'open',
    amount_due: 2000,
    hosted_invoice_url: HOSTED_URL,
    ...overrides,
  } as Stripe.Invoice;
}

describe('findPayableOpenInvoiceForSubscription', () => {
  it('returns the hosted payment URL from the expanded latest invoice', async () => {
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_past',
          latest_invoice: invoice({ id: 'in_latest' }),
        }),
      },
      invoices: {
        retrieve: vi.fn(),
        list: vi.fn(),
      },
    } as unknown as Stripe;

    const result = await findPayableOpenInvoiceForSubscription(
      stripe,
      'sub_past'
    );

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_past', {
      expand: ['latest_invoice'],
    });
    expect(result).toEqual({
      invoiceId: 'in_latest',
      hostedInvoiceUrl: HOSTED_URL,
    });
    expect(stripe.invoices.list).not.toHaveBeenCalled();
  });

  it('retrieves the latest invoice when Stripe returns only its id', async () => {
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_past',
          latest_invoice: 'in_latest',
        }),
      },
      invoices: {
        retrieve: vi.fn().mockResolvedValue(invoice({ id: 'in_latest' })),
        list: vi.fn(),
      },
    } as unknown as Stripe;

    const result = await findPayableOpenInvoiceForSubscription(
      stripe,
      'sub_past'
    );

    expect(stripe.invoices.retrieve).toHaveBeenCalledWith('in_latest');
    expect(result?.invoiceId).toBe('in_latest');
  });

  it('uses another open invoice when the latest one is already paid', async () => {
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_past',
          latest_invoice: invoice({
            id: 'in_paid',
            status: 'paid',
            amount_due: 0,
          }),
        }),
      },
      invoices: {
        retrieve: vi.fn(),
        list: vi.fn().mockResolvedValue({
          data: [invoice({ id: 'in_open' })],
        }),
      },
    } as unknown as Stripe;

    const result = await findPayableOpenInvoiceForSubscription(
      stripe,
      'sub_past'
    );

    expect(stripe.invoices.list).toHaveBeenCalledWith({
      subscription: 'sub_past',
      status: 'open',
      limit: 10,
    });
    expect(result).toEqual({
      invoiceId: 'in_open',
      hostedInvoiceUrl: HOSTED_URL,
    });
  });

  it('keeps searching the open list when the latest invoice lookup fails', async () => {
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_past',
          latest_invoice: 'in_missing',
        }),
      },
      invoices: {
        retrieve: vi.fn().mockRejectedValue(new Error('no such invoice')),
        list: vi.fn().mockResolvedValue({
          data: [invoice({ id: 'in_open' })],
        }),
      },
    } as unknown as Stripe;

    const result = await findPayableOpenInvoiceForSubscription(
      stripe,
      'sub_past'
    );

    expect(result?.invoiceId).toBe('in_open');
  });

  it('returns null when the open invoice has no https hosted URL', async () => {
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_past',
          latest_invoice: invoice({
            id: 'in_open',
            hosted_invoice_url: 'http://invoice.stripe.com/i/not-secure',
          }),
        }),
      },
      invoices: {
        retrieve: vi.fn(),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    } as unknown as Stripe;

    await expect(
      findPayableOpenInvoiceForSubscription(stripe, 'sub_past')
    ).resolves.toBeNull();
  });

  it('returns null for a blank subscription id', async () => {
    const stripe = {
      subscriptions: { retrieve: vi.fn() },
    } as unknown as Stripe;

    await expect(
      findPayableOpenInvoiceForSubscription(stripe, '  ')
    ).resolves.toBeNull();
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });
});
