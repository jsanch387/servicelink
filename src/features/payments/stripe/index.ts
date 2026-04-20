/**
 * Stripe logic owned by the **payments** feature (Connect onboarding, etc.).
 * Shared client / redirect URL helpers live in `@/libs/stripe`.
 */
export { getDefaultConnectAccountCountry } from './connect/constants';
export { startExpressConnectOnboarding } from './connect/startExpressConnectOnboarding';
export type {
  ConnectOnboardingUserContext,
  StartExpressConnectOnboardingParams,
  StartExpressConnectOnboardingResult,
} from './connect/startExpressConnectOnboarding';
