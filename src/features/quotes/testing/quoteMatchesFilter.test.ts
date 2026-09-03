import { quoteMatchesFilter } from '@/features/quotes/dashboard/utils/quoteStatusUi';
import { describe, expect, it } from 'vitest';

describe('quoteMatchesFilter', () => {
  it('puts drafts and requests in Requested', () => {
    expect(quoteMatchesFilter('draft', 'requested')).toBe(true);
    expect(quoteMatchesFilter('requested', 'requested')).toBe(true);
    expect(quoteMatchesFilter('sent', 'requested')).toBe(false);
    expect(quoteMatchesFilter('approved', 'requested')).toBe(false);
  });

  it('puts sent and viewed in Awaiting reply', () => {
    expect(quoteMatchesFilter('sent', 'awaiting_reply')).toBe(true);
    expect(quoteMatchesFilter('viewed', 'awaiting_reply')).toBe(true);
    expect(quoteMatchesFilter('draft', 'awaiting_reply')).toBe(false);
    expect(quoteMatchesFilter('approved', 'awaiting_reply')).toBe(false);
  });

  it('puts approved quotes in Approved', () => {
    expect(quoteMatchesFilter('approved', 'approved')).toBe(true);
    expect(quoteMatchesFilter('viewed', 'approved')).toBe(false);
    expect(quoteMatchesFilter('declined', 'approved')).toBe(false);
    expect(quoteMatchesFilter('expired', 'approved')).toBe(false);
    expect(quoteMatchesFilter('cancelled', 'approved')).toBe(false);
  });
});
