import crypto from 'crypto';

/**
 * URL-safe alphabet without ambiguous glyphs (0/O, 1/I/l).
 * 8 chars ≈ 47 bits of entropy — enough for non-secret receipt deep links
 * when paired with unguessable public_token still used for /i/…
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const INVOICE_SHORT_CODE_LENGTH = 8;

export function generateInvoiceShortCode(
  length: number = INVOICE_SHORT_CODE_LENGTH
): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}

export function isValidInvoiceShortCode(raw: string): boolean {
  const code = raw.trim();
  if (code.length < 6 || code.length > 12) return false;
  for (const ch of code) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return true;
}
