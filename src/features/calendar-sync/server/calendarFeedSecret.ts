import { createHash } from 'crypto';

/**
 * Secret for HMAC calendar feed tokens.
 *
 * Prefer `CALENDAR_FEED_SECRET` in production so feed URLs are independent of
 * your Supabase service key. If unset, we derive a stable secret from
 * `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` — fine when that key
 * rarely changes; rotating the Supabase key would invalidate every owner’s
 * calendar subscription URL until they re-add the feed.
 */
export function getCalendarFeedSecret(): string {
  const explicit = process.env.CALENDAR_FEED_SECRET?.trim();
  if (explicit) return explicit;

  const serviceKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    return createHash('sha256').update(serviceKey, 'utf8').digest('hex');
  }

  throw new Error(
    'Set CALENDAR_FEED_SECRET (recommended) or Supabase service keys for calendar feed signing.'
  );
}
