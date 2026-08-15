import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { assertOwnerMembershipScheduleLinkRateLimits } from '@/server/rateLimit/ownerMembershipScheduleLinkRateLimit';

describe('assertOwnerMembershipScheduleLinkRateLimits', () => {
  it('allows then blocks after the hourly budget (memory path)', async () => {
    const userId = '00000000-0000-4000-8000-ownerScheduleLinkRateTest';
    const request = new NextRequest(
      'https://example.com/api/memberships/subscribers/x'
    );

    for (let i = 0; i < 8; i++) {
      const r = await assertOwnerMembershipScheduleLinkRateLimits(
        request,
        userId
      );
      expect(r.ok, `attempt ${i + 1}`).toBe(true);
    }

    const blocked = await assertOwnerMembershipScheduleLinkRateLimits(
      request,
      userId
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe('user');
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});
