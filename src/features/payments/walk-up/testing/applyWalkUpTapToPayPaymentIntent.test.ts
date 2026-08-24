import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { applyWalkUpTapToPayPaymentIntent } from '../applyWalkUpTapToPayPaymentIntent';
import { WALKUP_PAYMENT_TAP_TO_PAY_KIND } from '../constants';

function makePaymentIntent(
  overrides?: Partial<Stripe.PaymentIntent>
): Stripe.PaymentIntent {
  return {
    id: 'pi_test_1',
    amount: 4000,
    amount_received: 4000,
    metadata: {
      kind: WALKUP_PAYMENT_TAP_TO_PAY_KIND,
      paymentRequestId: 'req_1',
      businessId: 'biz_1',
      note: 'Lights',
    },
    ...overrides,
  } as Stripe.PaymentIntent;
}

function makeEvent(
  type: Stripe.Event['type'],
  account?: string
): Stripe.Event {
  return { id: 'evt_1', type, account } as Stripe.Event;
}

function tapToPayRow(overrides?: Record<string, unknown>) {
  return {
    id: 'req_1',
    business_id: 'biz_1',
    collection_method: 'tap_to_pay',
    status: 'open',
    amount_cents: 4000,
    stripe_payment_intent_id: 'pi_test_1',
    ...overrides,
  };
}

function makeSupabase(opts: {
  row?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
  paymentAccount?: { stripe_account_id: string } | null;
}) {
  const updates: Record<string, unknown>[] = [];
  const eqAfterUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
    neq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });

  const from = vi.fn((table: string) => {
    if (table === 'payment_accounts') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: opts.paymentAccount ?? { stripe_account_id: 'acct_123' },
              error: null,
            }),
          }),
        }),
      };
    }

    return {
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
    };
  });

  return { supabase: { from } as never, updates };
}

describe('applyWalkUpTapToPayPaymentIntent', () => {
  it('ignores PaymentIntents that are not walk-up Tap to Pay', async () => {
    const { supabase, updates } = makeSupabase({ row: null });
    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent({
        metadata: { kind: 'booking_tap_to_pay' },
      }),
    });
    expect(result).toEqual({
      handled: false,
      reason: 'not_walkup_tap_to_pay',
    });
    expect(updates).toHaveLength(0);
  });

  it('does not update a payment-link row', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow({ collection_method: 'checkout_link' }),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({
      handled: false,
      reason: 'not_tap_to_pay_row',
      retry: false,
    });
    expect(updates).toHaveLength(0);
  });

  it('does not update when metadata businessId does not match the row', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow({ business_id: 'biz_other' }),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({
      handled: false,
      reason: 'business_mismatch',
      retry: false,
    });
    expect(updates).toHaveLength(0);
  });

  it('does not update when the Connect event account is not this business', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow(),
      paymentAccount: { stripe_account_id: 'acct_123' },
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded', 'acct_attacker'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({
      handled: false,
      reason: 'stripe_account_mismatch',
      retry: false,
    });
    expect(updates).toHaveLength(0);
  });

  it('marks an open row paid when the amount matches', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow(),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      status: 'paid',
      paid_amount_cents: 4000,
      stripe_payment_intent_id: 'pi_test_1',
    });
    expect(typeof updates[0]?.paid_at).toBe('string');
  });

  it('is a no-op when the row is already paid', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow({ status: 'paid' }),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates).toHaveLength(0);
  });

  it('marks the row failed when Stripe amount does not match', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow(),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent({ amount: 5000, amount_received: 5000 }),
    });

    expect(result).toEqual({ handled: true });
    expect(updates[0]).toMatchObject({
      status: 'failed',
      paid_amount_cents: 5000,
    });
  });

  it('asks Stripe to retry when marking paid fails', async () => {
    const { supabase } = makeSupabase({
      row: tapToPayRow(),
      updateError: { message: 'db down' },
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.succeeded'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({
      handled: false,
      reason: 'persist_failed',
      retry: true,
    });
  });

  it('marks an open row canceled', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow(),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.canceled'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates[0]).toMatchObject({
      status: 'canceled',
      stripe_payment_intent_id: 'pi_test_1',
    });
  });

  it('marks an open row failed on payment_failed', async () => {
    const { supabase, updates } = makeSupabase({
      row: tapToPayRow(),
    });

    const result = await applyWalkUpTapToPayPaymentIntent(supabase, {
      event: makeEvent('payment_intent.payment_failed'),
      paymentIntent: makePaymentIntent(),
    });

    expect(result).toEqual({ handled: true });
    expect(updates[0]).toMatchObject({
      status: 'failed',
    });
  });
});
