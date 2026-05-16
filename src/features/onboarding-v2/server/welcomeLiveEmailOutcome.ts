/**
 * Welcome-live email result for onboarding complete API response.
 */

export type WelcomeEmailSkipReason =
  | 'already_completed_no_flag'
  | 'no_owner_email'
  | 'no_business_profile'
  | 'no_business_slug';

export type WelcomeEmailOutcome =
  | { attempted: false; reason: WelcomeEmailSkipReason }
  | { attempted: true; sent: true }
  | { attempted: true; sent: false; error: string };
