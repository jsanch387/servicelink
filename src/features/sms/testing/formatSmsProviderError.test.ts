import { describe, expect, it } from 'vitest';
import { formatSmsProviderError } from '../services/sendSms';

describe('formatSmsProviderError', () => {
  it('uses Error.message', () => {
    expect(formatSmsProviderError(new Error('timeout'))).toBe('timeout');
  });

  it('includes HTTP status and Telnyx error fields when present', () => {
    const err = Object.assign(new Error('Request failed'), {
      statusCode: 400,
      error: {
        errors: [{ code: '40001', title: 'Invalid destination' }],
      },
    });
    expect(formatSmsProviderError(err)).toBe(
      'HTTP 400: code=40001: Invalid destination'
    );
  });

  it('stringifies non-Error values', () => {
    expect(formatSmsProviderError('boom')).toBe('boom');
  });

  it('truncates long messages', () => {
    const long = 'x'.repeat(600);
    const formatted = formatSmsProviderError(new Error(long));
    expect(formatted.length).toBeLessThanOrEqual(500);
    expect(formatted.endsWith('…')).toBe(true);
  });
});
