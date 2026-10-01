import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';

import {
  applyCustomerInvoiceCheckoutCompleted,
  CUSTOMER_INVOICE_CHECKOUT_KIND,
} from '../server/applyCustomerInvoiceCheckoutCompleted';

vi.mock('../server/notifyOwnerInvoicePaid', () => ({
  notifyOwnerInvoicePaid: vi.fn(async () => undefined),
}));

function makeSession(
  overrides?: Partial<Stripe.Checkout.Session>
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_1',
    amount_total: 20000,
    payment_status: 'paid',
    metadata: {
      kind: CUSTOMER_INVOICE_CHECKOUT_KIND,
      invoiceId: 'inv_1',
      businessId: 'biz_1',
    },
    ...overrides,
  } as Stripe.Checkout.Session;
}

function makeSupabase(opts: {
  row?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
}) {
  const updates: Record<string, unknown>[] = [];
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: opts.row === undefined ? null : opts.row,
          error: null,
        }),
      }),
    }),
    update: vi.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
        }),
      };
    }),
  }));

  return { supabase: { from } as never, updates };
}

describe('applyCustomerInvoiceCheckoutCompleted', () => {
  it('ignores checkout sessions that are not invoices', async () => {
    const { supabase, updates } = makeSupabase({ row: null });
    const result = await applyCustomerInvoiceCheckoutCompleted(supabase, {
      session: makeSession({ metadata: { kind: 'walkup_payment_link' } }),
    });

    expect(result).toEqual({
      handled: false,
      reason: 'not_customer_invoice',
    });
    expect(updates).toHaveLength(0);
  });

  it('marks a sent invoice paid when the amount matches', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'sent', total_cents: 20000 },
    });

    const result = await applyCustomerInvoiceCheckoutCompleted(supabase, {
      eventId: 'evt_1',
      session: makeSession(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates[0]).toMatchObject({ status: 'paid' });
    expect(typeof updates[0]?.paid_at).toBe('string');
  });

  it('does not mark a void invoice paid', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'void', total_cents: 20000 },
    });

    const result = await applyCustomerInvoiceCheckoutCompleted(supabase, {
      session: makeSession(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(0);
  });

  it('does not mark paid when the amount does not match', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'inv_1', status: 'sent', total_cents: 20000 },
    });

    const result = await applyCustomerInvoiceCheckoutCompleted(supabase, {
      session: makeSession({ amount_total: 100 }),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(0);
  });
});
