import { describe, expect, it } from 'vitest';
import { formatMembershipVisitWhen } from '../utils/formatMembershipVisitWhen';

describe('formatMembershipVisitWhen', () => {
  it('formats ISO date and 24h time for English', () => {
    expect(formatMembershipVisitWhen('2026-09-15', '09:00', 'en')).toBe(
      'Tuesday, September 15, 2026 · 9 AM'
    );
  });

  it('keeps minutes when they are not :00', () => {
    expect(formatMembershipVisitWhen('2026-09-15', '09:30', 'en')).toBe(
      'Tuesday, September 15, 2026 · 9:30 AM'
    );
  });
});
