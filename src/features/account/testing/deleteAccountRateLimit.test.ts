import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('assertDeleteAccountRateLimit', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('allows first request and blocks immediate second request for same user', async () => {
    vi.resetModules();
    const { assertDeleteAccountRateLimit } = await import(
      '@/features/account/server/deleteAccountRateLimit'
    );

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      headers: {
        'x-forwarded-for': '1.2.3.4',
      },
    });

    const first = await assertDeleteAccountRateLimit(req, 'user-1');
    const second = await assertDeleteAccountRateLimit(req, 'user-1');

    expect(first).toEqual({ ok: true });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe('user');
    expect(second.retryAfterSec).toBeGreaterThan(0);
  });

  it('blocks different users from same IP on immediate second attempt', async () => {
    vi.resetModules();
    const { assertDeleteAccountRateLimit } = await import(
      '@/features/account/server/deleteAccountRateLimit'
    );

    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      headers: {
        'x-forwarded-for': '5.6.7.8',
      },
    });

    const firstUser = await assertDeleteAccountRateLimit(req, 'user-A');
    const secondUserSameIp = await assertDeleteAccountRateLimit(req, 'user-B');

    expect(firstUser).toEqual({ ok: true });
    expect(secondUserSameIp.ok).toBe(false);
    if (secondUserSameIp.ok) return;
    expect(secondUserSameIp.reason).toBe('ip');
    expect(secondUserSameIp.retryAfterSec).toBeGreaterThan(0);
  });
});
