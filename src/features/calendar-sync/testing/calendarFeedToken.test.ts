import { afterEach, describe, expect, it, vi } from 'vitest';

describe('calendarFeedToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('signs and verifies a business id', async () => {
    vi.stubEnv('CALENDAR_FEED_SECRET', 'unit-test-secret');
    const { signCalendarFeedToken, verifyCalendarFeedToken } = await import(
      '../server/calendarFeedToken'
    );
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const token = signCalendarFeedToken(id);
    expect(verifyCalendarFeedToken(token)).toBe(id);
    expect(verifyCalendarFeedToken('wrong')).toBeNull();
    expect(verifyCalendarFeedToken(`${id}.deadbeef`)).toBeNull();
  });
});
