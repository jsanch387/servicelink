import { createHmac, timingSafeEqual } from 'crypto';
import { getMembershipsManageSecret } from './membershipManageSecret';

const SIG_HEX_LEN = 40;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function signMembershipId(membershipId: string): string {
  return createHmac('sha256', getMembershipsManageSecret())
    .update(membershipId, 'utf8')
    .digest('hex')
    .slice(0, SIG_HEX_LEN);
}

/** Public manage token: `{membershipId}.{sig}` */
export function signMembershipManageToken(membershipId: string): string {
  const id = membershipId.trim();
  if (!UUID_RE.test(id)) {
    throw new Error('Invalid membership id for manage token');
  }
  return `${id}.${signMembershipId(id)}`;
}

/** Returns membership id when the token is valid; otherwise `null`. */
export function verifyMembershipManageToken(token: string): string | null {
  const raw = token.trim();
  const dot = raw.indexOf('.');
  if (dot < 0) return null;
  const membershipId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!UUID_RE.test(membershipId) || sig.length !== SIG_HEX_LEN) return null;
  const expected = signMembershipId(membershipId);
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return membershipId;
}
