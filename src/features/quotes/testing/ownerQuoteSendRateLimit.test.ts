import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { assertOwnerQuoteSendRateLimits } from '@/server/rateLimit/ownerQuoteSendRateLimit';

/**
 * Without Upstash env, limiter uses in-memory sliding window (60/hour per user).
 * Isolated test user id avoids colliding with other suites in the same process.
 */
describe('assertOwnerQuoteSendRateLimits', () => {
  it('allows then blocks after user hourly budget (memory path)', async () => {
    const userId = '00000000-0000-4000-8000-ownerQuoteSendRateTest';
    const request = new NextRequest('https://example.com/api/quotes/send');

    for (let i = 0; i < 60; i++) {
      const r = await assertOwnerQuoteSendRateLimits(request, userId);
      expect(r.ok, `attempt ${i + 1}`).toBe(true);
    }

    const blocked = await assertOwnerQuoteSendRateLimits(request, userId);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe('user');
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});
