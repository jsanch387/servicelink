/**
 * Official App Store listing for the ServiceLink iOS app.
 * Set `NEXT_PUBLIC_IOS_APP_STORE_URL` in env for production.
 */
export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
  'https://apps.apple.com/us/app/servicelink-for-business/id6768877250';

/**
 * Official Google Play listing for the ServiceLink Android app.
 * Set `NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL` in env to override.
 */
export const GOOGLE_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL?.trim() ||
  'https://play.google.com/store/apps/details?id=com.myservicelink.app';
