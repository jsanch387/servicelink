import { formatUsPhoneDigits, US_PHONE_DIGIT_COUNT } from '@/lib/formatUsPhone';

/** Trimmed email, or null if missing (UI omits row). */
export function getCustomerEmailDisplay(
  email: string | null | undefined
): string | null {
  const e = email?.trim();
  return e ? e : null;
}

/** US 10-digit phone for tel: + display string, or null if not usable. */
export function getCustomerPhoneLink(
  phone: string | null | undefined
): { tel: string; display: string } | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length !== US_PHONE_DIGIT_COUNT) return null;
  return { tel: digits, display: formatUsPhoneDigits(digits) };
}
