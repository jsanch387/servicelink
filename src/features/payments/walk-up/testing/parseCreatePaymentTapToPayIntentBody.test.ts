import { describe, expect, it } from 'vitest';
import { parseCreatePaymentTapToPayIntentBody } from '../parseCreatePaymentTapToPayIntentBody';

describe('parseCreatePaymentTapToPayIntentBody', () => {
  it('accepts amount, note, and optional stripeAccountId', () => {
    const result = parseCreatePaymentTapToPayIntentBody({
      amountCents: 4000,
      currency: 'usd',
      note: '  Lights  ',
      stripeAccountId: ' acct_123 ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body).toEqual({
      amountCents: 4000,
      currency: 'usd',
      note: 'Lights',
      stripeAccountId: 'acct_123',
    });
  });

  it('omits stripeAccountId when it is not sent', () => {
    const result = parseCreatePaymentTapToPayIntentBody({
      amountCents: 4000,
      note: 'Cabin detail',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.stripeAccountId).toBeUndefined();
  });

  it('rejects an empty stripeAccountId', () => {
    const result = parseCreatePaymentTapToPayIntentBody({
      amountCents: 4000,
      note: 'Lights',
      stripeAccountId: '   ',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a blank note', () => {
    const result = parseCreatePaymentTapToPayIntentBody({
      amountCents: 4000,
      note: '   ',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/note/i);
  });

  it('rejects amounts below the Stripe USD minimum', () => {
    const result = parseCreatePaymentTapToPayIntentBody({
      amountCents: 49,
      note: 'Lights',
    });
    expect(result.ok).toBe(false);
  });
});
