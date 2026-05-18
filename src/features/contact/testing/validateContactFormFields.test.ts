import { describe, expect, it } from 'vitest';

import {
  getContactFormFieldErrors,
  isValidContactFormEmail,
} from '../utils/validateContactFormFields';

const validBody = {
  email: 'jane@example.com',
  topic: 'bug_report',
  message: 'The booking button does not load on mobile Safari.',
  website: '',
};

describe('getContactFormFieldErrors', () => {
  it('returns null for valid payload', () => {
    expect(getContactFormFieldErrors(validBody)).toBeNull();
  });

  it('flags invalid email format', () => {
    const errors = getContactFormFieldErrors({
      ...validBody,
      email: 'not-an-email',
    });
    expect(errors?.email).toBe('Enter a valid email address');
  });

  it('flags missing email', () => {
    const errors = getContactFormFieldErrors({ ...validBody, email: '   ' });
    expect(errors?.email).toBe('Email is required');
  });
});

describe('isValidContactFormEmail', () => {
  it('accepts formatted addresses', () => {
    expect(isValidContactFormEmail('user@example.com')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidContactFormEmail('user@')).toBe(false);
    expect(isValidContactFormEmail('')).toBe(false);
  });
});
