import { describe, expect, it } from 'vitest';
import { isTelnyxCarrierOptOutError } from '../services/sendSms';

describe('isTelnyxCarrierOptOutError', () => {
  it('detects Telnyx 40300 on error.errors', () => {
    expect(
      isTelnyxCarrierOptOutError({
        error: {
          errors: [{ code: '40300', title: 'Blocked due to STOP message' }],
        },
      })
    ).toBe(true);
  });

  it('detects STOP wording in formatted Error', () => {
    const err = Object.assign(new Error('Blocked due to STOP message'), {
      error: {
        errors: [{ code: '40300', title: 'Blocked due to STOP message' }],
      },
    });
    expect(isTelnyxCarrierOptOutError(err)).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(
      isTelnyxCarrierOptOutError({
        error: { errors: [{ code: '40001', title: 'Invalid destination' }] },
      })
    ).toBe(false);
  });
});
