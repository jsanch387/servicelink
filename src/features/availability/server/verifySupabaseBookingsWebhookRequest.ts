import { createHmac, timingSafeEqual } from 'crypto';

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies a Supabase Database Webhook (or compatible) POST.
 * Supports:
 * - `Authorization: Bearer <secret>` (configure the same value in Supabase HTTP Headers)
 * - `x-supabase-signature`: HMAC-SHA256 of the raw body, hex (common pattern in docs / integrations)
 * - `x-supabase-signature`: same HMAC, standard base64 (some setups)
 */
export function verifySupabaseBookingsWebhookRequest(
  rawBody: string,
  headers: Headers,
  secret: string
): boolean {
  const trimmed = secret.trim();
  if (!trimmed) {
    return false;
  }

  const auth = headers.get('authorization')?.trim();
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    return timingSafeStringEqual(token, trimmed);
  }

  const sigHeader = headers.get('x-supabase-signature')?.trim();
  if (!sigHeader) {
    return false;
  }

  const digest = createHmac('sha256', trimmed).update(rawBody).digest();

  const hexExpected = digest.toString('hex');
  if (
    timingSafeStringEqual(sigHeader.toLowerCase(), hexExpected.toLowerCase())
  ) {
    return true;
  }

  try {
    const sigHexBuf = Buffer.from(sigHeader, 'hex');
    if (
      sigHexBuf.length === digest.length &&
      timingSafeEqual(sigHexBuf, digest)
    ) {
      return true;
    }
  } catch {
    // invalid hex
  }

  try {
    const sigB64Buf = Buffer.from(sigHeader, 'base64');
    if (
      sigB64Buf.length === digest.length &&
      timingSafeEqual(sigB64Buf, digest)
    ) {
      return true;
    }
  } catch {
    // invalid base64
  }

  return false;
}
