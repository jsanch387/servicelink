/**
 * Telnyx client (SMS provider) – server-only.
 * Mirrors `features/email/services/resendClient`: returns null when the API key
 * is not configured so callers can no-op gracefully in local/dev.
 */

import Telnyx from 'telnyx';

const apiKey = process.env.TELNYX_API_KEY?.trim();

let cached: Telnyx | null | undefined;

/** Returns a singleton Telnyx client, or null when `TELNYX_API_KEY` is unset. */
export function getTelnyxClient(): Telnyx | null {
  if (cached !== undefined) return cached;
  if (!apiKey) {
    cached = null;
    return cached;
  }
  cached = new Telnyx({ apiKey });
  return cached;
}

/**
 * Toll-free (or other) sender number in E.164 (e.g. `+18005551234`).
 * Required to send; must be a number on the Telnyx account / messaging profile.
 */
export function getTelnyxFromNumber(): string | undefined {
  return process.env.TELNYX_FROM_NUMBER?.trim() || undefined;
}

/** True when both Telnyx API key and from-number are set. */
export function isTelnyxSmsConfigured(): boolean {
  return Boolean(getTelnyxClient() && getTelnyxFromNumber());
}
