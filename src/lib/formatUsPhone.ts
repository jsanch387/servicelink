/** US mobile/local: 10 digits → (XXX) XXX-XXXX */
export const US_PHONE_DIGIT_COUNT = 10;

export function formatUsPhoneDigits(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, US_PHONE_DIGIT_COUNT);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, US_PHONE_DIGIT_COUNT)}`;
}
