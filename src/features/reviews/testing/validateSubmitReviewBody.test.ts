import { describe, expect, it } from 'vitest';
import {
  normalizeReviewBodyForDb,
  validateSubmitReviewBody,
} from '../server/validateSubmitReviewBody';

describe('validateSubmitReviewBody', () => {
  it('accepts valid rating and optional empty body', () => {
    const result = validateSubmitReviewBody({
      token: 'abc',
      rating: 5,
      body: '',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).toBe('—');
      expect(result.value.rating).toBe(5);
    }
  });

  it('rejects missing rating', () => {
    expect(false);
  });

  it('rejects rating out of range', () => {
    expect(
      validateSubmitReviewBody({ token: 'x', rating: 6, body: '' }).ok
    ).toBe(false);
  });
});

describe('normalizeReviewBodyForDb', () => {
  it('trims and keeps non-empty text', () => {
    expect(normalizeReviewBodyForDb('  hello  ')).toBe('hello');
  });
});
