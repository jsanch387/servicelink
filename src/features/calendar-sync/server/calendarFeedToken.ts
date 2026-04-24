import { createHmac, timingSafeEqual } from 'crypto';
import { getCalendarFeedSecret } from './calendarFeedSecret';

const SIG_HEX_LEN = 40;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function signBusinessId(businessId: string): string {
  const secret = getCalendarFeedSecret();
  return createHmac('sha256', secret)
    .update(businessId, 'utf8')
    .digest('hex')
    .slice(0, SIG_HEX_LEN);
}

/** Public feed URL segment: `{businessId}.{sig}` */
export function signCalendarFeedToken(businessId: string): string {
  const id = businessId.trim();
  if (!UUID_RE.test(id)) {
    throw new Error('Invalid business id for calendar feed token');
  }
  return `${id}.${signBusinessId(id)}`;
}

/** Returns `businessId` when the token is valid; otherwise `null`. */
export function verifyCalendarFeedToken(token: string): string | null {
  const raw = token.trim();
  const dot = raw.indexOf('.');
  if (dot < 0) return null;
  const businessId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!UUID_RE.test(businessId) || sig.length !== SIG_HEX_LEN) return null;
  const expected = signBusinessId(businessId);
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return businessId;
}
