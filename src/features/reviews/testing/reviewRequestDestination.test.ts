import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REVIEW_REQUEST_DESTINATION,
  parseReviewRequestDestination,
} from '../server/reviewRequestDestination';

describe('parseReviewRequestDestination', () => {
  it('accepts known values', () => {
    expect(parseReviewRequestDestination('servicelink')).toBe('servicelink');
    expect(parseReviewRequestDestination('google')).toBe('google');
  });

  it('falls back to servicelink for invalid values', () => {
    expect(parseReviewRequestDestination(null)).toBe(
      DEFAULT_REVIEW_REQUEST_DESTINATION
    );
    expect(parseReviewRequestDestination('maps')).toBe(
      DEFAULT_REVIEW_REQUEST_DESTINATION
    );
  });
});
