/** First-touch UTM payload from marketing landing URLs. */
export const MARKETING_UTM_STORAGE_KEY = 'sl_marketing_utm_attribution';

/** Set when user completes signup — triggers attribution sync after session exists. */
export const PENDING_SIGNUP_ATTRIBUTION_KEY = 'sl_pending_signup_attribution';

/** Per-user browser guard so we only POST signup attribution once. */
export function signupAttributionSyncedKey(userId: string): string {
  return `sl_signup_attr_synced:${userId}`;
}

/** Only attach signup attribution for profiles created within this window. */
export const SIGNUP_ATTRIBUTION_PROFILE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
