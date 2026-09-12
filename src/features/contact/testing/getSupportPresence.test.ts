import { describe, expect, it } from 'vitest';

import { getSupportPresence } from '../utils/getSupportPresence';

function atChicago(isoUtc: string) {
  return new Date(isoUtc);
}

describe('getSupportPresence', () => {
  it('is active on a weekday mid-morning', () => {
    // Tuesday Sep 15, 2026 10:02 CT (CDT, UTC-5)
    const presence = getSupportPresence(atChicago('2026-09-15T15:02:00.000Z'));
    expect(presence.state).toBe('active');
    expect(presence.statusLabel).toMatch(/^Active \d+m ago$/);
    expect(presence.replyLabel).toMatch(/today/i);
  });

  it('is recent around weekday lunch', () => {
    const presence = getSupportPresence(atChicago('2026-09-15T17:20:00.000Z'));
    expect(presence.state).toBe('recent');
    expect(presence.statusLabel).toMatch(/^Active \d+m ago$/);
  });

  it('is away Friday evening and promises Monday', () => {
    // Friday Sep 18, 2026 19:10 CT
    const presence = getSupportPresence(atChicago('2026-09-19T00:10:00.000Z'));
    expect(presence.state).toBe('away');
    expect(presence.replyLabel).toMatch(/Monday/i);
  });

  it('is away on Saturday', () => {
    const presence = getSupportPresence(atChicago('2026-09-19T18:00:00.000Z'));
    expect(presence.state).toBe('away');
    expect(presence.statusLabel).toMatch(/Last seen/i);
  });

  it('is away before weekday open', () => {
    // Tuesday 6:15 CT
    const presence = getSupportPresence(atChicago('2026-09-15T11:15:00.000Z'));
    expect(presence.state).toBe('away');
    expect(presence.replyLabel).toMatch(/morning/i);
  });
});
