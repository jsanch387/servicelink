import { describe, expect, it } from 'vitest';

import { parseAuthenticatedContactFormBody } from '../utils/parseAuthenticatedContactFormBody';

const validBody = {
  topic: 'feature_request',
  message: 'Please add dark mode to the dashboard.',
  website: '',
};

describe('parseAuthenticatedContactFormBody', () => {
  it('accepts topic and message only', () => {
    const result = parseAuthenticatedContactFormBody(validBody);
    expect(result).toEqual({
      ok: true,
      data: {
        topic: 'feature_request',
        message: 'Please add dark mode to the dashboard.',
      },
    });
  });

  it('rejects honeypot when filled', () => {
    const result = parseAuthenticatedContactFormBody({
      ...validBody,
      website: 'https://spam.com',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Invalid submission');
    }
  });

  it('ignores name and email in body', () => {
    const result = parseAuthenticatedContactFormBody({
      ...validBody,
      name: 'Spoofed',
      email: 'spoof@evil.com',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        topic: 'feature_request',
        message: 'Please add dark mode to the dashboard.',
      });
    }
  });

  it('requires message minimum length', () => {
    const result = parseAuthenticatedContactFormBody({
      ...validBody,
      message: 'short',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Message must be at least 10 characters');
    }
  });
});
