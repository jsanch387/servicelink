import { describe, expect, it } from 'vitest';
import { verifySupabaseBookingsWebhookRequest } from '../verifySupabaseBookingsWebhookRequest';

describe('verifySupabaseBookingsWebhookRequest', () => {
  const secret = 'test-secret-key-for-hmac';

  it('accepts matching Bearer token', () => {
    const headers = new Headers({
      authorization: `Bearer ${secret}`,
    });
    expect(
      verifySupabaseBookingsWebhookRequest('{"type":"INSERT"}', headers, secret)
    ).toBe(true);
  });

  it('rejects wrong Bearer token', () => {
    const headers = new Headers({
      authorization: 'Bearer wrong',
    });
    expect(
      verifySupabaseBookingsWebhookRequest('{"type":"INSERT"}', headers, secret)
    ).toBe(false);
  });

  it('accepts hex HMAC-SHA256 of raw body in x-supabase-signature', async () => {
    const { createHmac } = await import('crypto');
    const raw = '{"type":"INSERT","table":"bookings"}';
    const hex = createHmac('sha256', secret).update(raw).digest('hex');
    const headers = new Headers({
      'x-supabase-signature': hex,
    });
    expect(verifySupabaseBookingsWebhookRequest(raw, headers, secret)).toBe(
      true
    );
  });

  it('rejects tampered body for HMAC mode', async () => {
    const { createHmac } = await import('crypto');
    const raw = '{"type":"INSERT"}';
    const hex = createHmac('sha256', secret).update(raw).digest('hex');
    const headers = new Headers({
      'x-supabase-signature': hex,
    });
    expect(
      verifySupabaseBookingsWebhookRequest('{"type":"UPDATE"}', headers, secret)
    ).toBe(false);
  });
});
