import { validateConnectAccountLinkUrl } from '@/libs/stripe/validateConnectAccountLinkUrl';
import { describe, expect, it } from 'vitest';

describe('validateConnectAccountLinkUrl', () => {
  it('accepts https URLs', () => {
    const r = validateConnectAccountLinkUrl(
      'https://example.com/payments/connect-return',
      'X'
    );
    expect(r).toEqual({
      ok: true,
      href: 'https://example.com/payments/connect-return',
    });
  });

  it('accepts http for local dev', () => {
    const r = validateConnectAccountLinkUrl(
      'http://localhost:3000/bridge/connect',
      'X'
    );
    expect(r.ok).toBe(true);
  });

  it('strips wrapping quotes from env-style values', () => {
    const r = validateConnectAccountLinkUrl('"https://example.com/r"', 'X');
    expect(r).toEqual({ ok: true, href: 'https://example.com/r' });
  });

  it('rejects custom schemes (Stripe url_invalid)', () => {
    const r = validateConnectAccountLinkUrl('myapp://connect/return', 'ENV');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('http');
    }
  });

  it('rejects relative paths', () => {
    const r = validateConnectAccountLinkUrl('/dashboard/payments', 'ENV');
    expect(r.ok).toBe(false);
  });
});
