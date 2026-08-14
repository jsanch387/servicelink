import {
  formatUsPhoneWithCountry,
  toUsE164,
  US_PHONE_DIGIT_COUNT,
} from '@/lib/formatUsPhone';

/** Trimmed email, or null if missing (UI omits row). */
export function getCustomerEmailDisplay(
  email: string | null | undefined
): string | null {
  const e = email?.trim();
  return e ? e : null;
}

/** US phone for tel: + display string, or null if not a complete US number. */
export function getCustomerPhoneLink(
  phone: string | null | undefined
): { tel: string; display: string } | null {
  const e164 = toUsE164(phone);
  if (!e164) return null;
  const national = e164.slice(-US_PHONE_DIGIT_COUNT);
  if (national.length !== US_PHONE_DIGIT_COUNT) return null;
  return { tel: e164, display: formatUsPhoneWithCountry(national) };
}
