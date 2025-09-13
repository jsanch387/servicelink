/**
 * Onboarding Helpers - Main Export
 *
 * Re-exports all helper functions for easy importing
 */

// State management
export {
  getOnboardingState,
  type OnboardingState,
} from './helpers/onboardingState';

// Actions
export {
  startOnboarding,
  updateOnboardingProgress,
  completeOnboarding,
  saveStepAndProgress,
} from './helpers/onboardingActions';
