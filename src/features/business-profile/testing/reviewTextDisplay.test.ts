import { describe, expect, it } from 'vitest';
import {
  reviewCollapsedMaxChars,
  reviewTextNeedsExpand,
  truncateReviewText,
} from '../reviews/utils/reviewTextDisplay';

describe('reviewTextDisplay', () => {
  it('uses higher limits on desktop', () => {
    expect(reviewCollapsedMaxChars('reviewBody', false)).toBe(180);
    expect(reviewCollapsedMaxChars('reviewBody', true)).toBe(360);
    expect(reviewCollapsedMaxChars('ownerReply', false)).toBe(120);
    expect(reviewCollapsedMaxChars('ownerReply', true)).toBe(240);
  });

  it('truncates at word boundary with ellipsis', () => {
    const long =
      'Excellent service and attention to detail throughout the entire visit today.';
    const out = truncateReviewText(long, 40);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(43);
  });

  it('detects when expand is needed', () => {
    expect(reviewTextNeedsExpand('short', 180)).toBe(false);
    expect(reviewTextNeedsExpand('x'.repeat(200), 180)).toBe(true);
  });
});
