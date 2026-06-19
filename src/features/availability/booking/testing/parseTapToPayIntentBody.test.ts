import { describe, expect, it } from 'vitest';
import { parseTapToPayIntentBody } from '@/features/availability/booking/server/parseTapToPayIntentBody';

describe('parseTapToPayIntentBody', () => {
  it('defaults sessionFees to empty array', () => {
    const parsed = parseTapToPayIntentBody({});
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.body.sessionFees).toEqual([]);
    }
  });

  it('parses valid sessionFees', () => {
    const parsed = parseTapToPayIntentBody({
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.body.sessionFees).toEqual([
        { label: 'Pet hair', amountCents: 2500 },
      ]);
    }
  });

  it('rejects invalid sessionFees', () => {
    const parsed = parseTapToPayIntentBody({
      sessionFees: [{ label: '', amountCents: 100 }],
    });
    expect(parsed.ok).toBe(false);
  });
});
