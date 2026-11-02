import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { applyWalkUpPaymentCheckoutCompleted } from '../applyWalkUpPaymentCheckoutCompleted';
import { WALKUP_PAYMENT_LINK_KIND } from '../constants';

function makeSession(
  overrides?: Partial<Stripe.Checkout.Session>
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_1',
    amount_total: 4000,
    payment_intent: 'pi_test_1',
    metadata: {
      kind: WALKUP_PAYMENT_LINK_KIND,
      paymentRequestId: 'req_1',
      businessId: 'biz_1',
    },
    ...overrides,
  } as Stripe.Checkout.Session;
}

function makeEvent(): Stripe.Event {
  return { id: 'evt_1', type: 'checkout.session.completed' } as Stripe.Event;
}

function makeSupabase(opts: {
  row?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
}) {
  const updates: Record<string, unknown>[] = [];
  const eqAfterUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
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

describe('applyWalkUpPaymentCheckoutCompleted', () => {
  it('ignores sessions that are not walk-up payment links', async () => {
    const { supabase, updates } = makeSupabase({ row: null });
    const result = await applyWalkUpPaymentCheckoutCompleted(supabase, {
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

  it('marks an open row paid when the amount matches', async () => {
    const { supabase, updates } = makeSupabase({
      row: {
        id: 'req_1',
        status: 'open',
        amount_cents: 4000,
        stripe_checkout_session_id: 'cs_test_1',
      },
    });

    const result = await applyWalkUpPaymentCheckoutCompleted(supabase, {
      event: makeEvent(),
      session: makeSession(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      status: 'paid',
      paid_amount_cents: 4000,
      stripe_checkout_session_id: 'cs_test_1',
      stripe_payment_intent_id: 'pi_test_1',
    });
    expect(typeof updates[0]?.paid_at).toBe('string');
  });

  it('is a no-op when the row is already paid', async () => {
    const { supabase, updates } = makeSupabase({
      row: {
        id: 'req_1',
        status: 'paid',
        amount_cents: 4000,
        stripe_checkout_session_id: 'cs_test_1',
      },
    });

    const result = await applyWalkUpPaymentCheckoutCompleted(supabase, {
      event: makeEvent(),
      session: makeSession(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(0);
  });

  it('marks the row failed when Stripe amount does not match', async () => {
    const { supabase, updates } = makeSupabase({
      row: {
        id: 'req_1',
        status: 'open',
        amount_cents: 4000,
        stripe_checkout_session_id: 'cs_test_1',
      },
    });

    const result = await applyWalkUpPaymentCheckoutCompleted(supabase, {
      event: makeEvent(),
      session: makeSession({ amount_total: 5000 }),
    });

    expect(result).toEqual({ handled: true });
    expect(updates[0]).toMatchObject({
      status: 'failed',
      paid_amount_cents: 5000,
    });
  });
});
