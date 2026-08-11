import { createHash } from 'crypto';

/**
 * Secret for HMAC membership manage / cancel portal links.
 * Prefer `MEMBERSHIPS_MANAGE_SECRET`; else derive from Supabase service key.
 */
export function getMembershipsManageSecret(): string {
  const explicit = process.env.MEMBERSHIPS_MANAGE_SECRET?.trim();
  if (explicit) return explicit;

  const serviceKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    return createHash('sha256')
      .update(`memberships-manage:${serviceKey}`, 'utf8')
      .digest('hex');
  }

  throw new Error(
    'Set MEMBERSHIPS_MANAGE_SECRET (recommended) or Supabase service keys for membership manage links.'
  );
}
