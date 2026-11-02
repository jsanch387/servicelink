import type Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';
import { chargeOpenPlatformSubscription } from '../server/chargeOpenPlatformSubscription';

function stripeWithInvoice(options: {
  latest?: Partial<Stripe.Invoice> | string | null;
  openInvoices?: Partial<Stripe.Invoice>[];
  pay?: ReturnType<typeof vi.fn>;
}) {
  const pay =
    options.pay ?? vi.fn().mockResolvedValue({ id: 'in_open', status: 'paid' });
  const stripe = {
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_past',
        latest_invoice: options.latest ?? null,
      }),
    },
    invoices: {
      list: vi.fn().mockResolvedValue({ data: options.openInvoices ?? [] }),
      pay,
    },
  } as unknown as Stripe;
  return { stripe, pay };
}

describe('chargeOpenPlatformSubscription', () => {
  it('charges the open invoice with the card already on file', async () => {
    const { stripe, pay } = stripeWithInvoice({
      latest: {
        id: 'in_open',
        status: 'open',
        amount_due: 2000,
        hosted_invoice_url: 'https://invoice.stripe.com/i/acct/test',
      },
    });

    const result = await chargeOpenPlatformSubscription(stripe, 'sub_past');

    expect(result).toEqual({ ok: true });
    expect(pay).toHaveBeenCalledWith('in_open');
    expect(pay.mock.calls[0]).toHaveLength(1);
  });

  it('returns a decline and does not treat it as paid', async () => {
    const { stripe } = stripeWithInvoice({
      latest: { id: 'in_open', status: 'open', amount_due: 2000 },
      pay: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('card declined'), { code: 'card_declined' })
        ),
    });

    const result = await chargeOpenPlatformSubscription(stripe, 'sub_past');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.url).toBeUndefined();
    }
  });

  it('sends the customer to confirm with their bank when the card requires it', async () => {
    const { stripe } = stripeWithInvoice({
      latest: {
        id: 'in_open',
        status: 'open',
        amount_due: 2000,
        hosted_invoice_url: 'https://invoice.stripe.com/i/acct/test',
      },
      pay: vi.fn().mockRejectedValue(
        Object.assign(new Error('authentication required'), {
          code: 'authentication_required',
        })
      ),
    });

    const result = await chargeOpenPlatformSubscription(stripe, 'sub_past');

    expect(result).toMatchObject({
      ok: false,
      status: 402,
      url: 'https://invoice.stripe.com/i/acct/test',
    });
  });

  it('does not charge when there is no open bill', async () => {
    const { stripe, pay } = stripeWithInvoice({
      latest: { id: 'in_paid', status: 'paid', amount_due: 0 },
      openInvoices: [],
    });

    const result = await chargeOpenPlatformSubscription(stripe, 'sub_past');

    expect(result.ok).toBe(false);
    expect(pay).not.toHaveBeenCalled();
  });
});
