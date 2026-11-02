import { describe, expect, it } from 'vitest';
import { parseCreatePaymentLinkBody } from '../parseCreatePaymentLinkBody';

describe('parseCreatePaymentLinkBody', () => {
  it('accepts a valid amount, usd, and note', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 4000,
      currency: 'usd',
      note: '  Lights  ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body).toEqual({
      amountCents: 4000,
      currency: 'usd',
      note: 'Lights',
    });
  });

  it('defaults currency to usd when omitted', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 4000,
      note: 'Cabin detail',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.currency).toBe('usd');
  });

  it('rejects missing or non-integer amounts', () => {
    expect(parseCreatePaymentLinkBody({ note: 'Lights' }).ok).toBe(false);
    expect(
      parseCreatePaymentLinkBody({ amountCents: 10.5, note: 'Lights' }).ok
    ).toBe(false);
    expect(
      parseCreatePaymentLinkBody({ amountCents: 0, note: 'Lights' }).ok
    ).toBe(false);
  });

  it('rejects amounts below the Stripe USD minimum', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 49,
      note: 'Lights',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('$0.50');
  });

  it('rejects amounts above the mobile keypad cap', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 1_000_000,
      note: 'Lights',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('$9,999.99');
  });

  it('rejects a blank note', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 4000,
      note: '   ',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/note/i);
  });

  it('rejects a note over 200 characters', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 4000,
      note: 'x'.repeat(201),
    });
    expect(result.ok).toBe(false);
  });

  it('rejects non-usd currency', () => {
    const result = parseCreatePaymentLinkBody({
      amountCents: 4000,
      currency: 'eur',
      note: 'Lights',
    });
    expect(result.ok).toBe(false);
  });
});
