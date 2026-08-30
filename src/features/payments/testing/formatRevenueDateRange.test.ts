import { describe, expect, it } from 'vitest';
import { formatRevenueDateRange } from '../utils/formatRevenueDateRange';

describe('formatRevenueDateRange', () => {
  it('shows a single day without a dash', () => {
    expect(formatRevenueDateRange('2026-08-28', '2026-08-28')).toBe(
      'Aug 28, 2026'
    );
  });

  it('omits the start year when both dates share a year', () => {
    expect(formatRevenueDateRange('2026-08-22', '2026-08-28')).toBe(
      'Aug 22 – Aug 28, 2026'
    );
  });
});
