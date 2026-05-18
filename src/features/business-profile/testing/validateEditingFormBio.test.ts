import { describe, expect, it } from 'vitest';

import {
  BUSINESS_BIO_MAX_LENGTH,
  getBioLengthValidationError,
} from '../constants/businessBio';

describe('business bio max length', () => {
  it('allows bio up to the max length', () => {
    expect(
      getBioLengthValidationError('a'.repeat(BUSINESS_BIO_MAX_LENGTH))
    ).toBeNull();
  });

  it('rejects bio over the max length', () => {
    expect(
      getBioLengthValidationError('a'.repeat(BUSINESS_BIO_MAX_LENGTH + 1))
    ).toBe(`Bio must be ${BUSINESS_BIO_MAX_LENGTH} characters or fewer`);
  });
});
