import { handleCronGet } from '@/features/cron/server/handleCronGet';
import { afterEach, describe, expect, it, vi } from 'vitest';

function requestWith(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as never;
}

describe('handleCronGet', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.INTERNAL_PUSH_API_SECRET;
  });

  it('returns 503 when no secret is configured', async () => {
    const GET = handleCronGet(async () => ({ ran: true }));
    const res = await GET(requestWith());
    expect(res.status).toBe(503);
  });

  it('returns 401 for a missing header', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    const GET = handleCronGet(async () => ({ ran: true }));
    const res = await GET(requestWith());
    expect(res.status).toBe(401);
  });

  it('runs the job and returns ok plus result fields', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    const run = vi.fn().mockResolvedValue({ sent: 2 });
    const GET = handleCronGet(run);
    const res = await GET(requestWith({ authorization: 'Bearer cron-secret' }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, sent: 2 });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when the job throws', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    const GET = handleCronGet(async () => {
      throw new Error('boom');
    });
    const res = await GET(requestWith({ authorization: 'Bearer cron-secret' }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      error: 'Internal error',
    });
  });
});
