import { describe, expect, it, vi } from 'vitest';
import { isGoogleReviewSyncStale } from '../server/googleReviewSyncFreshness';
import { runScheduledGoogleReviewPulls } from '../server/runScheduledGoogleReviewPulls';

function adminReturning(rows: { business_id: string }[] | null, error: { message: string } | null = null) {
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => ({ data: rows, error }),
        }),
      }),
    }),
  };
}

describe('isGoogleReviewSyncStale', () => {
  const now = Date.parse('2026-11-02T00:00:00.000Z');

  it('is stale when Google has never been pulled', () => {
    expect(isGoogleReviewSyncStale(null, now)).toBe(true);
  });

  it('is fresh inside the 12 hour window', () => {
    expect(
      isGoogleReviewSyncStale('2026-11-01T14:00:00.000Z', now)
    ).toBe(false);
  });

  it('is stale after 12 hours', () => {
    expect(
      isGoogleReviewSyncStale('2026-11-01T11:00:00.000Z', now)
    ).toBe(true);
  });
});

describe('runScheduledGoogleReviewPulls', () => {
  it('pulls each connection and keeps going after a failure', async () => {
    const pull = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, importedCount: 3 })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, importedCount: 1 });

    const result = await runScheduledGoogleReviewPulls(
      adminReturning([
        { business_id: 'a' },
        { business_id: 'b' },
        { business_id: 'c' },
      ]) as never,
      { pull }
    );

    expect(pull).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      found: 3,
      pulled: 2,
      imported: 4,
      failed: 1,
    });
  });

  it('throws when the connection list cannot be loaded', async () => {
    await expect(
      runScheduledGoogleReviewPulls(
        adminReturning(null, { message: 'db down' }) as never
      )
    ).rejects.toThrow('Could not list Google connections');
  });
});
