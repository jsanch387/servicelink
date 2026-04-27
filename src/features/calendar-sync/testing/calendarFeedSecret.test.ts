import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getCalendarFeedSecret', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns trimmed CALENDAR_FEED_SECRET when set', async () => {
    vi.stubEnv('CALENDAR_FEED_SECRET', '  my-dedicated-secret  ');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'ignored-when-explicit');
    const { getCalendarFeedSecret } = await import(
      '../server/calendarFeedSecret'
    );
    expect(getCalendarFeedSecret()).toBe('my-dedicated-secret');
  });

  it('derives a stable 64-char hex secret from Supabase service role when unset', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-value');
    const { getCalendarFeedSecret } = await import(
      '../server/calendarFeedSecret'
    );
    const a = getCalendarFeedSecret();
    const b = getCalendarFeedSecret();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('prefers SUPABASE_SECRET_KEY over SUPABASE_SERVICE_ROLE_KEY', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'secret-key-wins');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role');
    const { getCalendarFeedSecret } = await import(
      '../server/calendarFeedSecret'
    );
    const withSecretKey = getCalendarFeedSecret();

    vi.unstubAllEnvs();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role');
    const { getCalendarFeedSecret: getAgain } = await import(
      '../server/calendarFeedSecret'
    );
    const serviceOnly = getAgain();

    expect(withSecretKey).not.toBe(serviceOnly);
  });

  it('throws when no explicit secret and no Supabase keys', async () => {
    vi.stubEnv('CALENDAR_FEED_SECRET', '');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const { getCalendarFeedSecret } = await import(
      '../server/calendarFeedSecret'
    );
    expect(() => getCalendarFeedSecret()).toThrow(/CALENDAR_FEED_SECRET/);
  });
});
