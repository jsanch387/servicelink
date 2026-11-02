import { describe, expect, it } from 'vitest';
import { formatQuoteRequestWaitingLabel } from '@/features/quotes/dashboard/utils/formatQuoteRequestWaitingLabel';

describe('formatQuoteRequestWaitingLabel', () => {
  const now = new Date('2026-08-31T18:00:00.000Z');

  it('says requested today under 24h', () => {
    expect(
      formatQuoteRequestWaitingLabel('2026-08-31T10:00:00.000Z', now)
    ).toBe('Requested today');
  });

  it('counts whole days waiting', () => {
    expect(
      formatQuoteRequestWaitingLabel('2026-08-30T18:00:00.000Z', now)
    ).toBe('Waiting 1 day');
    expect(
      formatQuoteRequestWaitingLabel('2026-08-28T18:00:00.000Z', now)
    ).toBe('Waiting 3 days');
  });
});
