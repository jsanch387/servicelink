import { describe, expect, it } from 'vitest';
import { parseMembershipPlanWriteBody } from '../server/parseMembershipPlanWriteBody';

const base = {
  name: 'Exterior Wash',
  description: '',
  visitDurationMinutes: 60,
};

describe('parseMembershipPlanWriteBody', () => {
  it('accepts every 3 months and every 6 months', () => {
    const parsed = parseMembershipPlanWriteBody({
      ...base,
      cadenceOptions: [
        { intervalUnit: 'month', intervalCount: 3, priceCents: 15000 },
        { intervalUnit: 'month', intervalCount: 6, priceCents: 24000 },
      ],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.cadenceOptions).toEqual([
      { intervalUnit: 'month', intervalCount: 3, priceCents: 15000 },
      { intervalUnit: 'month', intervalCount: 6, priceCents: 24000 },
    ]);
  });

  it('accepts the weekly, biweekly, and monthly schedules', () => {
    const parsed = parseMembershipPlanWriteBody({
      ...base,
      cadenceOptions: [
        { intervalUnit: 'week', intervalCount: 1, priceCents: 4900 },
        { intervalUnit: 'week', intervalCount: 2, priceCents: 7900 },
        { intervalUnit: 'month', intervalCount: 1, priceCents: 8900 },
      ],
    });

    expect(parsed.ok).toBe(true);
  });

  it('rejects a yearly schedule', () => {
    const parsed = parseMembershipPlanWriteBody({
      ...base,
      cadenceOptions: [
        { intervalUnit: 'year', intervalCount: 1, priceCents: 40000 },
      ],
    });

    expect(parsed).toEqual({
      ok: false,
      error: 'That schedule is not available.',
    });
  });
});
