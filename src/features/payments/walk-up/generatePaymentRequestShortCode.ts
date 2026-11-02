import crypto from 'crypto';

/**
 * URL-safe alphabet without ambiguous glyphs (0/O, 1/I/l).
 * Same idea as invoice `/r/…` short codes.
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const PAYMENT_REQUEST_SHORT_CODE_LENGTH = 8;

export function generatePaymentRequestShortCode(
  length: number = PAYMENT_REQUEST_SHORT_CODE_LENGTH
): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}

export function isValidPaymentRequestShortCode(raw: string): boolean {
  const code = raw.trim();
  if (code.length < 6 || code.length > 12) return false;
  for (const ch of code) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return true;
}
