import { describe, expect, it } from 'vitest';
import { normalizedCustomerRecipientEmail } from '../utils/normalizedCustomerRecipientEmail';

describe('normalizedCustomerRecipientEmail', () => {
  it('returns null for empty, whitespace, non-string, or invalid', () => {
    expect(normalizedCustomerRecipientEmail('')).toBeNull();
    expect(normalizedCustomerRecipientEmail('   ')).toBeNull();
    expect(normalizedCustomerRecipientEmail('not-an-email')).toBeNull();
    expect(normalizedCustomerRecipientEmail(null)).toBeNull();
    expect(normalizedCustomerRecipientEmail(undefined)).toBeNull();
  });

  it('returns trimmed address when valid', () => {
    expect(normalizedCustomerRecipientEmail('  a@b.co  ')).toBe('a@b.co');
  });
});
