import { toUsE164 } from '@/lib/formatUsPhone';

/**
 * Normalize a free-form stored phone number to E.164 (e.g. +15551234567).
 * SMS providers require E.164. Returns null when the input cannot be
 * confidently normalized so callers skip the SMS rather than send to a bad
 * number.
 *
 * App is US-only today: national numbers always get hardcoded +1.
 * Numbers already in +E.164 are kept (other countries reserved for later).
 */

export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already E.164-ish: starts with + and has 8-15 digits.
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return null;
    // Bare +XXXXXXXXXX (10 digits, no country) → treat as US.
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  }

  // National / formatted US → always +1…
  return toUsE164(trimmed);
}
