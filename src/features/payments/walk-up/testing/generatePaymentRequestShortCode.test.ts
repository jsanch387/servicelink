import { describe, expect, it } from 'vitest';
import {
  generatePaymentRequestShortCode,
  isValidPaymentRequestShortCode,
  PAYMENT_REQUEST_SHORT_CODE_LENGTH,
} from '../generatePaymentRequestShortCode';

describe('generatePaymentRequestShortCode', () => {
  it('returns an 8-character URL-safe code', () => {
    const code = generatePaymentRequestShortCode();
    expect(code).toHaveLength(PAYMENT_REQUEST_SHORT_CODE_LENGTH);
    expect(isValidPaymentRequestShortCode(code)).toBe(true);
  });

  it('rejects invalid codes', () => {
    expect(isValidPaymentRequestShortCode('')).toBe(false);
    expect(isValidPaymentRequestShortCode('abc')).toBe(false);
    expect(isValidPaymentRequestShortCode('OOOOOOOO')).toBe(false);
  });
});
