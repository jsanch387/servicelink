import { describe, expect, it } from 'vitest';

import { parseContactFormBody } from '../utils/parseContactFormBody';

const validBody = {
  email: 'jane@example.com',
  topic: 'bug_report',
  message: 'The booking button does not load on mobile Safari.',
  website: '',
};

describe('parseContactFormBody', () => {
  it('accepts a valid payload and derives display name from email', () => {
    const result = parseContactFormBody(validBody);
    expect(result).toEqual({
      ok: true,
      data: {
        name: 'jane',
        email: 'jane@example.com',
        topic: 'bug_report',
        message: 'The booking button does not load on mobile Safari.',
      },
    });
  });

  it('ignores client-supplied name', () => {
    const result = parseContactFormBody({
      ...validBody,
      name: 'Spoofed Name',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('jane');
    }
  });

  it('rejects honeypot when filled', () => {
    const result = parseContactFormBody({
      ...validBody,
      website: 'https://spam.com',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Invalid submission');
    }
  });

  it('requires a valid email', () => {
    const result = parseContactFormBody({
      ...validBody,
      email: 'not-an-email',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Enter a valid email address');
    }
  });

  it('requires message minimum length', () => {
    const result = parseContactFormBody({ ...validBody, message: 'short' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Message must be at least 10 characters');
    }
  });

  it('requires a known topic', () => {
    const result = parseContactFormBody({ ...validBody, topic: 'billing' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Select what you need help with');
    }
  });
});
