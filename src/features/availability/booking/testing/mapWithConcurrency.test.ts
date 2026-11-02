import { mapWithConcurrency } from '@/features/availability/booking/server/reminders/mapWithConcurrency';
import { describe, expect, it } from 'vitest';

describe('mapWithConcurrency', () => {
  it('returns an empty list for no items', async () => {
    const result = await mapWithConcurrency([], 5, async n => n);
    expect(result).toEqual([]);
  });

  it('preserves input order', async () => {
    const result = await mapWithConcurrency([3, 1, 2], 2, async n => {
      await new Promise(resolve => setTimeout(resolve, 5 * n));
      return n * 10;
    });
    expect(result).toEqual([30, 10, 20]);
  });

  it('never runs more than concurrency workers at once', async () => {
    let current = 0;
    let max = 0;
    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async n => {
      current += 1;
      max = Math.max(max, current);
      await new Promise(resolve => setTimeout(resolve, 15));
      current -= 1;
      return n;
    });
    expect(max).toBeLessThanOrEqual(2);
    expect(max).toBe(2);
  });
});
