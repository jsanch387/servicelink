import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';
import crypto from 'crypto';
import { describe, expect, it } from 'vitest';

describe('resolveQuoteTokenHash', () => {
  it('hashes raw URL tokens to sha256 hex', () => {
    const raw = 'my-base64url-token';
    expect(resolveQuoteTokenHash(raw)).toBe(
      crypto.createHash('sha256').update(raw).digest('hex')
    );
  });

  it('returns lowercase hex when input is already a 64-char sha256 hash', () => {
    const upper = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789';
    expect(resolveQuoteTokenHash(upper)).toBe(upper.toLowerCase());
  });

  it('trims whitespace', () => {
    const raw = 'token';
    expect(resolveQuoteTokenHash(`  ${raw}  `)).toBe(
      crypto.createHash('sha256').update(raw).digest('hex')
    );
  });

  it('returns empty string for blank input', () => {
    expect(resolveQuoteTokenHash('')).toBe('');
    expect(resolveQuoteTokenHash('   ')).toBe('');
  });
});
