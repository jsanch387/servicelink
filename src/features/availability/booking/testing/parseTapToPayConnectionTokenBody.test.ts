import { describe, expect, it } from 'vitest';
import {
  parseTapToPayConnectionTokenBody,
  resolveTapToPayStripeAccountId,
} from '@/features/availability/booking/server/parseTapToPayConnectionTokenBody';

describe('parseTapToPayConnectionTokenBody', () => {
  it('accepts an empty body', () => {
    expect(parseTapToPayConnectionTokenBody({})).toEqual({
      ok: true,
      body: {},
    });
  });

  it('parses stripeAccountId', () => {
    expect(
      parseTapToPayConnectionTokenBody({ stripeAccountId: ' acct_123 ' })
    ).toEqual({
      ok: true,
      body: { stripeAccountId: 'acct_123' },
    });
  });

  it('rejects invalid stripeAccountId', () => {
    expect(parseTapToPayConnectionTokenBody({ stripeAccountId: 123 }).ok).toBe(
      false
    );
  });
});

describe('resolveTapToPayStripeAccountId', () => {
  it('returns the booking account when body omits stripeAccountId', () => {
    expect(
      resolveTapToPayStripeAccountId({
        bookingStripeAccountId: 'acct_booking',
      })
    ).toEqual({ ok: true, stripeAccountId: 'acct_booking' });
  });

  it('accepts a matching requested account', () => {
    expect(
      resolveTapToPayStripeAccountId({
        bookingStripeAccountId: 'acct_same',
        requestedStripeAccountId: 'acct_same',
      })
    ).toEqual({ ok: true, stripeAccountId: 'acct_same' });
  });

  it('rejects a mismatched requested account', () => {
    expect(
      resolveTapToPayStripeAccountId({
        bookingStripeAccountId: 'acct_booking',
        requestedStripeAccountId: 'acct_other',
      })
    ).toEqual({
      ok: false,
      error: 'Stripe account does not match this business.',
    });
  });
});
