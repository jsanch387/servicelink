import { describe, expect, it } from 'vitest';
import {
  getEmailTypoHint,
  isValidEmail,
  validateSignUpForm,
} from '../utils/validation';

describe('getEmailTypoHint', () => {
  it('suggests .com when the TLD is .con', () => {
    expect(getEmailTypoHint('jonathan.rrios@icloud.con')).toBe(
      'Did you mean jonathan.rrios@icloud.com?'
    );
  });

  it('suggests gmail.com for gnail.com', () => {
    expect(getEmailTypoHint('ada@gnail.com')).toBe(
      'Did you mean ada@gmail.com?'
    );
  });

  it('returns null for a real address', () => {
    expect(getEmailTypoHint('jonathan.rrios@icloud.com')).toBeNull();
  });
});

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('jonathan.rrios@icloud.com')).toBe(true);
  });

  it('rejects a .con typo', () => {
    expect(isValidEmail('jonathan.rrios@icloud.con')).toBe(false);
  });
});

describe('validateSignUpForm', () => {
  const base = {
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  it('surfaces the .con typo instead of a generic invalid-email error', () => {
    const result = validateSignUpForm({
      ...base,
      email: 'jonathan.rrios@icloud.con',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Did you mean jonathan.rrios@icloud.com?');
  });
});
