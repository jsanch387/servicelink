import { describe, expect, it } from 'vitest';

import { onboardingSlugCandidate } from '../server/onboardingSlug';

describe('onboardingSlugCandidate', () => {
  it('strips punctuation and spaces', () => {
    expect(onboardingSlugCandidate("Mike's Detailing", 0)).toBe(
      'mikesdetailing'
    );
  });

  it('appends the next number when the first choice is taken', () => {
    expect(onboardingSlugCandidate('mikesdetailing', 1)).toBe(
      'mikesdetailing2'
    );
  });
});
