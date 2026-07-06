/**
 * Normalize a free-form stored phone number to E.164 (e.g. +15551234567).
 * Pingram requires E.164. Returns null when the input cannot be confidently
 * normalized so callers skip the SMS rather than send to a bad number.
 *
 * Assumes US/CA (+1) for 10-digit numbers, matching the app's current
 * single-locale phone collection. Numbers already prefixed with `+` are kept.
 */

const DEFAULT_COUNTRY_CODE = '1';

export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already E.164-ish: starts with + and has 8-15 digits.
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  const digits = trimmed.replace(/\D/g, '');

  // 10-digit national number → assume default country code.
  if (digits.length === 10) return `+${DEFAULT_COUNTRY_CODE}${digits}`;

  // 11-digit starting with the default country code (e.g. 1XXXXXXXXXX).
  if (digits.length === 11 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `+${digits}`;
  }

  // Other lengths are ambiguous without a country context; skip.
  return null;
}
