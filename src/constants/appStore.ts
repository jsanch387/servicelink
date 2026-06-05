/**
 * Official App Store listing for the ServiceLink iOS app.
 * Set `NEXT_PUBLIC_IOS_APP_STORE_URL` in env for production.
 */
export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
  'https://apps.apple.com/us/app/servicelink-for-business/id6768877250';

/** Set `NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL` when the Android app is live. */
export const GOOGLE_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL?.trim() || '';
