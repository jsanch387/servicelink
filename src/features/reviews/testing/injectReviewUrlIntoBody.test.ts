import { describe, expect, it } from 'vitest';

import { injectReviewUrlIntoBody } from '../utils/injectReviewUrlIntoBody';

describe('injectReviewUrlIntoBody', () => {
  it('replaces the placeholder', () => {
    expect(
      injectReviewUrlIntoBody(
        'Thanks — leave a review: [review link]',
        'https://app.example/review/abc'
      )
    ).toBe('Thanks — leave a review: https://app.example/review/abc');
  });

  it('leaves an existing review URL alone', () => {
    const body = 'Thanks https://app.example/review/already';
    expect(
      injectReviewUrlIntoBody(body, 'https://app.example/review/new')
    ).toBe(body);
  });

  it('appends when the placeholder is missing', () => {
    expect(
      injectReviewUrlIntoBody(
        'Thanks again.',
        'https://app.example/review/abc'
      )
    ).toBe('Thanks again. https://app.example/review/abc');
  });
});
