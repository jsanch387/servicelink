import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { describe, expect, it } from 'vitest';

import { ownerCustomizedHours } from '../ownerCustomizedHours';

describe('ownerCustomizedHours', () => {
  it('ignores the Monday to Friday 9 to 5 schedule from signup', () => {
    expect(ownerCustomizedHours(DEFAULT_SCHEDULE, 'mon_fri_9_5')).toBe(false);
    expect(
      ownerCustomizedHours(
        {
          ...DEFAULT_SCHEDULE,
          monday: { enabled: true, start: '09:00:00', end: '17:00:00' },
        },
        'mon_fri_9_5'
      )
    ).toBe(false);
  });

  it('counts a changed day or a different preset', () => {
    expect(
      ownerCustomizedHours(
        {
          ...DEFAULT_SCHEDULE,
          saturday: { enabled: true, start: '09:00', end: '17:00' },
        },
        'mon_fri_9_5'
      )
    ).toBe(true);
    expect(ownerCustomizedHours(DEFAULT_SCHEDULE, 'custom')).toBe(true);
  });
});
