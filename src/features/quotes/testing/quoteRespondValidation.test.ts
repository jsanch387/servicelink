import { validateQuoteRespondRequest } from '@/features/quotes/public-view/validateQuoteRespondRequest';
import { describe, expect, it } from 'vitest';

describe('validateQuoteRespondRequest', () => {
  it('rejects missing token or invalid decision', () => {
    expect(validateQuoteRespondRequest({}).ok).toBe(false);
    expect(
      validateQuoteRespondRequest({ token: 'abc', decision: 'maybe' }).ok
    ).toBe(false);
    const bad = validateQuoteRespondRequest({ token: '', decision: 'decline' });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.error).toBe('Invalid request');
  });

  it('requires service address when approving', () => {
    const short = validateQuoteRespondRequest({
      token: 'tok',
      decision: 'approve',
      serviceAddress: 'short',
    });
    expect(short.ok).toBe(false);
    if (short.ok) return;
    expect(short.error).toBe('Service address is required to accept quote');

    const missing = validateQuoteRespondRequest({
      token: 'tok',
      decision: 'approve',
    });
    expect(missing.ok).toBe(false);
  });

  it('accepts decline without address', () => {
    const result = validateQuoteRespondRequest({
      token: '  raw-token  ',
      decision: 'decline',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.decision).toBe('decline');
    expect(result.data.token).toBe('raw-token');
  });

  it('accepts approve with a long enough trimmed address', () => {
    const result = validateQuoteRespondRequest({
      token: 'abc',
      decision: 'approve',
      serviceAddress: '  123 Main St, City  ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.decision).toBe('approve');
    expect(result.data.serviceAddress).toBe('123 Main St, City');
  });
});
