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

  it('rejects approve without structured address or legacy line', () => {
    const short = validateQuoteRespondRequest({
      token: 'tok',
      decision: 'approve',
      serviceAddress: 'short',
    });
    expect(short.ok).toBe(false);
    if (short.ok) return;

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

  it('accepts approve with structured address', () => {
    const result = validateQuoteRespondRequest({
      token: 'abc',
      decision: 'approve',
      address: {
        street: '123 Main St',
        unit: '',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.decision).toBe('approve');
    if (result.data.decision !== 'approve') return;
    expect(result.data.address.street).toBe('123 Main St');
    expect(result.data.address.unit).toBe(null);
    expect(result.data.displayLine).toContain('Miami');
  });

  it('accepts approve with legacy long enough trimmed serviceAddress', () => {
    const result = validateQuoteRespondRequest({
      token: 'abc',
      decision: 'approve',
      serviceAddress: '  123 Main St, City  ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.decision).toBe('approve');
    if (result.data.decision !== 'approve') return;
    expect(result.data.address.street).toBe('123 Main St, City');
    expect(result.data.displayLine).toBe('123 Main St, City');
  });
});
