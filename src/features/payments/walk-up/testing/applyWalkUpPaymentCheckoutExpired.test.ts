import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { applyWalkUpPaymentCheckoutExpired } from '../applyWalkUpPaymentCheckoutExpired';
import { WALKUP_PAYMENT_LINK_KIND } from '../constants';

function makeSession(
  overrides?: Partial<Stripe.Checkout.Session>
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_1',
    metadata: {
      kind: WALKUP_PAYMENT_LINK_KIND,
      paymentRequestId: 'req_1',
    },
    ...overrides,
  } as Stripe.Checkout.Session;
}

function makeEvent(): Stripe.Event {
  return { id: 'evt_exp', type: 'checkout.session.expired' } as Stripe.Event;
}

function makeSupabase(opts: { row?: Record<string, unknown> | null }) {
  const updates: Record<string, unknown>[] = [];
  const eqAfterUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const from = vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: opts.row ?? null,
          error: null,
        }),
      }),
    }),
    update: vi.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      return { eq: eqAfterUpdate };
    }),
  }));

  return { supabase: { from } as never, updates };
}

describe('applyWalkUpPaymentCheckoutExpired', () => {
  it('ignores sessions that are not walk-up payment links', async () => {
    const { supabase, updates } = makeSupabase({ row: null });
    const result = await applyWalkUpPaymentCheckoutExpired(supabase, {
      event: makeEvent(),
      session: makeSession({
        metadata: { kind: 'booking_checkout' },
      }),
    });
    expect(result).toEqual({
      handled: false,
      reason: 'not_walkup_payment_link',
    });
    expect(updates).toHaveLength(0);
  });

  it('marks an open row expired', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'req_1', status: 'open' },
    });

    const result = await applyWalkUpPaymentCheckoutExpired(supabase, {
      event: makeEvent(),
      session: makeSession(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates[0]).toMatchObject({
      status: 'expired',
      stripe_checkout_session_id: 'cs_test_1',
    });
  });

  it('does not overwrite a paid row', async () => {
    const { supabase, updates } = makeSupabase({
      row: { id: 'req_1', status: 'paid' },
    });

    const result = await applyWalkUpPaymentCheckoutExpired(supabase, {
      event: makeEvent(),
      session: makeSession(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(0);
  });
});
