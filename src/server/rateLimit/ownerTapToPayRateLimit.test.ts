import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { assertOwnerTapToPayConnectionTokenRateLimits } from '@/server/rateLimit/ownerTapToPayRateLimit';

describe('assertOwnerTapToPayConnectionTokenRateLimits', () => {
  it('allows warm-up burst budget then blocks (memory path)', async () => {
    const userId = '00000000-0000-4000-8000-tapToPayConnRateTest';
    const request = new NextRequest(
      'https://example.com/api/payments/tap-to-pay/connection-token'
    );

    for (let i = 0; i < 40; i++) {
      const r = await assertOwnerTapToPayConnectionTokenRateLimits(
        request,
        userId
      );
      expect(r.ok, `attempt ${i + 1}`).toBe(true);
    }

    const blocked = await assertOwnerTapToPayConnectionTokenRateLimits(
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
