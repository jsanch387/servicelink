/** Come-back-and-finish emails. Later tracks add their own keys. */
export const SETUP_EMAIL_KEYS = [
  'A1_setup_one_step',
  'A2_setup_final',
  'A3_test_appointment',
] as const;

export type SetupEmailKey = (typeof SETUP_EMAIL_KEYS)[number];

/** Flip this in code to stop the job without a deploy config change. */
export const SETUP_EMAILS_ENABLED = true;

/** One US clock for “already emailed today.” Owners do not have a timezone stored. */
export const ONBOARDING_EMAIL_TIMEZONE = 'America/Chicago';

/** How far back a signup can be and still be considered for this track. */
export const SETUP_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

/** First note: the daily run on or after the morning a day later. */
export const A1_DELAY_MS = 24 * 60 * 60 * 1000;

/** Last note: three days after the first one was actually sent. */
export const A2_AFTER_FIRST_MS = 3 * 24 * 60 * 60 * 1000;

/** Test appointment: the morning a day after they finished, if they still have none. */
export const TEST_APPOINTMENT_DELAY_MS = 24 * 60 * 60 * 1000;

export const TEST_APPOINTMENT_KEY = 'A3_test_appointment' as const;

/** Profiles read per page while looking for someone who still needs a note. */
export const CANDIDATE_PAGE = 200;

/** Stop scanning so one run cannot walk the whole profiles table. */
export const CANDIDATE_PAGE_LIMIT = 5;

/**
 * Sends per run. Same idea as the Google review pull: a cap so one morning
 * cannot try to mail everyone at once. Whoever is left is still due tomorrow.
 */
export const SETUP_EMAIL_SEND_BATCH = 40;

/** Parallel Resend calls inside that batch. */
export const SETUP_EMAIL_SEND_CONCURRENCY = 5;

export const INTERNAL_EMAIL_DOMAIN = 'myservicelink.app';
