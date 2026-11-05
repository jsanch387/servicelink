import { describe, expect, it } from 'vitest';

import {
  isOnboardingV3AllowlistActive,
  onboardingFlowForEmail,
  ONBOARDING_V3_OWNER_EMAILS,
} from '../config/onboardingV3Allowlist';

describe('onboardingV3Allowlist', () => {
  it('limits the new setup to the listed emails', () => {
    expect(isOnboardingV3AllowlistActive()).toBe(true);
    expect(ONBOARDING_V3_OWNER_EMAILS).toContain('app.servicelink@gmail.com');
  });

  it('gives the new setup only to a listed email', () => {
    expect(onboardingFlowForEmail('app.servicelink@gmail.com')).toBe('v3');
    expect(onboardingFlowForEmail(' App.ServiceLink@gmail.com ')).toBe('v3');
    expect(onboardingFlowForEmail('someone@example.com')).toBe('v2');
    expect(onboardingFlowForEmail(null)).toBe('v2');
    expect(onboardingFlowForEmail('')).toBe('v2');
  });
});
