import { describe, expect, it } from 'vitest';
import {
  quotePublicLinkExpiryCopy,
  quotePublicLinkValidUntilCopy,
} from '@/features/quotes/dashboard/utils/formatQuotePublicLinkExpiry';

describe('quotePublicLinkExpiryCopy', () => {
  it('names the 14-day link window', () => {
    expect(quotePublicLinkExpiryCopy('2026-09-14T12:00:00.000Z')).toContain(
      '14 days'
    );
    expect(quotePublicLinkExpiryCopy('2026-09-14T12:00:00.000Z')).toContain(
      'Sep'
    );
  });
});

describe('quotePublicLinkValidUntilCopy', () => {
  it('shows a customer-facing valid-until date', () => {
    expect(quotePublicLinkValidUntilCopy('2026-09-14T12:00:00.000Z')).toBe(
      'Valid until Sep 14, 2026.'
    );
  });
});
