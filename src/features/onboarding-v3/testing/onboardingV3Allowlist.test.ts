import { describe, expect, it } from 'vitest';

import {
  isOnboardingV3AllowlistActive,
  onboardingFlowForEmail,
  ONBOARDING_V3_OWNER_EMAILS,
} from '../config/onboardingV3Allowlist';

describe('onboardingV3Allowlist', () => {
  it('leaves the new setup open to every signup', () => {
    expect(isOnboardingV3AllowlistActive()).toBe(false);
    expect(ONBOARDING_V3_OWNER_EMAILS).toEqual([]);
  });

  it('gives every signup the new setup', () => {
    expect(onboardingFlowForEmail('someone@example.com')).toBe('v3');
    expect(onboardingFlowForEmail('app.servicelink@gmail.com')).toBe('v3');
    expect(onboardingFlowForEmail(null)).toBe('v3');
    expect(onboardingFlowForEmail('')).toBe('v3');
  });
});
