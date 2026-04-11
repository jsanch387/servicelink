import crypto from 'crypto';

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i;

/**
 * Accepts either:
 * - raw quote token (legacy send flow), or
 * - token hash (when owner dashboard reads `quote_public_links.token_hash`).
 */
export function resolveQuoteTokenHash(tokenOrHash: string): string {
  const trimmed = tokenOrHash.trim();
  if (!trimmed) return '';
  if (SHA256_HEX_PATTERN.test(trimmed)) return trimmed.toLowerCase();
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}
