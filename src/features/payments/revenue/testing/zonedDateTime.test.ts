import { describe, expect, it } from 'vitest';
import {
  ymdWithYear,
  zonedDayEndUtc,
  zonedDayStartUtc,
} from '../zonedDateTime';

describe('zonedDateTime', () => {
  it('keeps end of day on the same UTC calendar date', () => {
    const end = zonedDayEndUtc('2025-08-28', 'UTC');
    expect(end.toISOString().slice(0, 10)).toBe('2025-08-28');
    expect(end.toISOString().endsWith('23:59:59.999Z')).toBe(true);
  });

  it('starts the day at midnight UTC', () => {
    expect(zonedDayStartUtc('2025-01-01', 'UTC').toISOString()).toBe(
      '2025-01-01T00:00:00.000Z'
    );
  });

  it('maps Feb 29 to Feb 28 in a non-leap year', () => {
    expect(ymdWithYear('2024-02-29', 2025)).toBe('2025-02-28');
    expect(ymdWithYear('2024-08-29', 2025)).toBe('2025-08-29');
  });
});
