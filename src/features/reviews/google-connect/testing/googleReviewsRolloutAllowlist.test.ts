import { describe, expect, it } from 'vitest';
import { isGoogleReviewsRolloutEmail } from '../googleReviewsRolloutAllowlist';

describe('googleReviewsRolloutAllowlist', () => {
  it('is only the prod test account', () => {
    expect(isGoogleReviewsRolloutEmail('jesuss387@gmail.com')).toBe(true);
    expect(isGoogleReviewsRolloutEmail('JESUSS387@gmail.com')).toBe(true);
    expect(isGoogleReviewsRolloutEmail('owner@example.com')).toBe(false);
    expect(isGoogleReviewsRolloutEmail(null)).toBe(false);
  });
});
