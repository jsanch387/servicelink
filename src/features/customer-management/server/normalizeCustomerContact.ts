/** Lowercase trimmed email for dedupe lookups. */
export function normalizeEmailForLookup(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Digits-only phone for dedupe; `null` if empty (no phone-based match).
 */
export function normalizePhoneForLookup(
  phone: string | null | undefined
): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}
