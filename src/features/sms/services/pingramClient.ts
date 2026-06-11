/**
 * Pingram client (SMS provider) – server-only.
 * Mirrors `features/email/services/resendClient`: returns null when the API key
 * is not configured so callers can no-op gracefully in local/dev.
 */

import { Pingram, type PingramRegion } from 'pingram';

const apiKey = process.env.PINGRAM_API_KEY;

function resolveRegion(): PingramRegion | undefined {
  const raw = process.env.PINGRAM_REGION?.trim().toLowerCase();
  if (raw === 'us' || raw === 'eu' || raw === 'ca') return raw;
  return undefined;
}

let cached: Pingram | null | undefined;

/** Returns a singleton Pingram client, or null when `PINGRAM_API_KEY` is unset. */
export function getPingramClient(): Pingram | null {
  if (cached !== undefined) return cached;
  if (!apiKey) {
    cached = null;
    return cached;
  }
  cached = new Pingram({ apiKey, region: resolveRegion() });
  return cached;
}

/**
 * Optional verified sender number override (must be a number on the Pingram
 * account). When unset, Pingram uses the account's default number.
 */
export function getPingramFromNumber(): string | undefined {
  return process.env.PINGRAM_FROM_NUMBER?.trim() || undefined;
}
