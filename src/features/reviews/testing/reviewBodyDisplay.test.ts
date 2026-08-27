import { describe, expect, it } from 'vitest';
import {
  REVIEW_BODY_EMPTY_PLACEHOLDER,
  isVisibleReviewBody,
} from '../utils/reviewBodyDisplay';

describe('isVisibleReviewBody', () => {
  it('hides empty, whitespace, and the star-only placeholder', () => {
    expect(isVisibleReviewBody('')).toBe(false);
    expect(isVisibleReviewBody('   ')).toBe(false);
    expect(isVisibleReviewBody(REVIEW_BODY_EMPTY_PLACEHOLDER)).toBe(false);
    expect(isVisibleReviewBody(` ${REVIEW_BODY_EMPTY_PLACEHOLDER} `)).toBe(
      false
    );
  });

  it('shows real comments', () => {
    expect(isVisibleReviewBody('Great work.')).toBe(true);
  });
});
