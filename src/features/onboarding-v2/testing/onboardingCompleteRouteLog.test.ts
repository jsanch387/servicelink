import { describe, expect, it, vi } from 'vitest';

import {
  ONBOARDING_ACTIVATE_LOG_TAG,
  logOnboardingActivate,
  logOnboardingActivateError,
} from '../server/onboardingCompleteRouteLog';

describe('onboarding activate logs', () => {
  it('logs simple info lines', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logOnboardingActivate('complete request started');
    logOnboardingActivate('welcome email sent');
    logOnboardingActivate('complete succeeded');

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.mock.calls[0][0]).toBe(
      `${ONBOARDING_ACTIVATE_LOG_TAG} complete request started`
    );

    spy.mockRestore();
  });

  it('logs simple error lines', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logOnboardingActivateError('welcome email failed');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toBe(
      `${ONBOARDING_ACTIVATE_LOG_TAG} welcome email failed`
    );

    spy.mockRestore();
  });
});
