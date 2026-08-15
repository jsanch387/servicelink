/** US mobile/local: 10 digits → (XXX) XXX-XXXX */
export const US_PHONE_DIGIT_COUNT = 10;

/** Hardcoded for now — SMS (Telnyx) and PhoneInput assume US/CA. */
export const US_PHONE_COUNTRY_CODE = '1';

/**
 * Digits only for US phone inputs. Strips a leading country-code `1` when
 * present (11+ digits) so `15807545207` → `5807545207`, not `(158) 075-4520`.
 */
export function normalizeUsPhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length >= 11 && digits.startsWith(US_PHONE_COUNTRY_CODE)) {
    digits = digits.slice(1);
  }
  return digits.slice(0, US_PHONE_DIGIT_COUNT);
}

export function formatUsPhoneDigits(digits: string): string {
  const cleaned = normalizeUsPhoneDigits(digits);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, US_PHONE_DIGIT_COUNT)}`;
}

/**
 * Read-only US display with country code: `+1 (XXX) XXX-XXXX`.
 * Strips a leading `1` so stored `15807545207` does not become `(158) 075-4520`.
 * Input fields should keep using `formatUsPhoneDigits` (the +1 prefix is separate).
 */
export function formatUsPhoneWithCountry(raw: string): string {
  const cleaned = normalizeUsPhoneDigits(raw);
  if (!cleaned) return raw.trim();
  return `+${US_PHONE_COUNTRY_CODE} ${formatUsPhoneDigits(cleaned)}`;
}

/** `tel:+1XXXXXXXXXX` for complete US numbers; otherwise null. */
export function usPhoneTelHref(raw: string | null | undefined): string | null {
  const e164 = toUsE164(raw);
  return e164 ? `tel:${e164}` : null;
}

export function toUsE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === US_PHONE_DIGIT_COUNT) {
    return `+${US_PHONE_COUNTRY_CODE}${digits}`;
  }
  if (
    digits.length === US_PHONE_DIGIT_COUNT + 1 &&
    digits.startsWith(US_PHONE_COUNTRY_CODE)
  ) {
    return `+${digits}`;
  }
  return null;
}
