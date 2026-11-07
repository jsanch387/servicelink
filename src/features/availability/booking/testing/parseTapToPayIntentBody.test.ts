import { describe, expect, it } from 'vitest';
import { parseTapToPayIntentBody } from '@/features/availability/booking/server/parseTapToPayIntentBody';

describe('parseTapToPayIntentBody', () => {
  it('defaults sessionFees to empty array and tip to zero', () => {
    const parsed = parseTapToPayIntentBody({});
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.body.sessionFees).toEqual([]);
      expect(parsed.body.tipCents).toBe(0);
    }
  });

  it('accepts a customer tip and rejects a negative tip', () => {
    const parsed = parseTapToPayIntentBody({ tipCents: 500 });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.body.tipCents).toBe(500);

    expect(parseTapToPayIntentBody({ tipCents: -1 }).ok).toBe(false);
    expect(parseTapToPayIntentBody({ tipCents: 1.5 }).ok).toBe(false);
  });

  it('parses valid sessionFees', () => {
    const parsed = parseTapToPayIntentBody({
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.body.sessionFees).toEqual([
        { kind: 'fee', label: 'Pet hair', amountCents: 2500 },
      ]);
    }
  });

  it('keeps a Tip label as a fee and accepts a payment-time discount', () => {
    const parsed = parseTapToPayIntentBody({
      sessionFees: [
        { label: 'Tip', amountCents: 500 },
        { kind: 'discount', label: 'Deposit', amountCents: 2000 },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.body.sessionFees).toEqual([
        { kind: 'fee', label: 'Tip', amountCents: 500 },
        { kind: 'discount', label: 'Deposit', amountCents: 2000 },
      ]);
    }
  });

  it('rejects a zero, negative, or oversized line and a negative dressed up as a discount', () => {
    expect(
      parseTapToPayIntentBody({
        sessionFees: [{ label: 'Deposit', amountCents: 0 }],
      }).ok
    ).toBe(false);
    expect(
      parseTapToPayIntentBody({
        sessionFees: [{ label: 'Deposit', amountCents: -500 }],
      }).ok
    ).toBe(false);
    expect(
      parseTapToPayIntentBody({
        sessionFees: [
          { kind: 'discount', label: 'Deposit', amountCents: -500 },
        ],
      }).ok
    ).toBe(false);
    expect(
      parseTapToPayIntentBody({
        sessionFees: [{ label: 'Travel', amountCents: 1_000_000 }],
      }).ok
    ).toBe(false);
  });

  it('rejects invalid sessionFees', () => {
    const parsed = parseTapToPayIntentBody({
      sessionFees: [{ label: '', amountCents: 100 }],
    });
    expect(parsed.ok).toBe(false);
  });
});
