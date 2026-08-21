import { verifyInternalCronAuth } from '@/features/cron/server/verifyInternalCronAuth';
import { afterEach, describe, expect, it } from 'vitest';

function requestWith(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as never;
}

describe('verifyInternalCronAuth', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.INTERNAL_PUSH_API_SECRET;
  });

  it('fails closed when no secret is configured', () => {
    expect(verifyInternalCronAuth(requestWith({}))).toBe('not_configured');
  });

  it('accepts Vercel Cron bearer CRON_SECRET', () => {
    process.env.CRON_SECRET = 'cron-secret';
    expect(
      verifyInternalCronAuth(
        requestWith({ authorization: 'Bearer cron-secret' })
      )
    ).toBe('ok');
  });

  it('accepts the internal push header', () => {
    process.env.INTERNAL_PUSH_API_SECRET = 'push-secret';
    expect(
      verifyInternalCronAuth(
        requestWith({ 'x-internal-push-secret': 'push-secret' })
      )
    ).toBe('ok');
  });

  it('rejects a wrong secret', () => {
    process.env.CRON_SECRET = 'cron-secret';
    expect(
      verifyInternalCronAuth(requestWith({ authorization: 'Bearer nope' }))
    ).toBe('unauthorized');
  });
});
